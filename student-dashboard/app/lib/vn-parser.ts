// VN scene parser - parses scene content with [tags] into structured blocks
// Handles [narration], [character:Name] *emotion*, [player_prompt] tags
// Handles conditional branches for multiple choice (## Expected output)

export type SubQuestion = {
  partNumber: number;
  questionText: string;
  rubricDimension?: string;
};

export type VNBlock =
  | { type: 'narration'; content: string }
  | { type: 'dialogue'; character: string; content: string; emotion?: string }
  | {
      type: 'player_prompt';
      isMultiChoice: boolean;
      options?: string[];
      prompt: string;
      branches?: { [key: string]: VNBlock[] }; // Map of option letter (A, B, C) to blocks
      isMultiPartFreeform?: boolean; // True if this is a high-mark question with numbered sub-points
      subQuestions?: SubQuestion[]; // Numbered sub-questions (1), 2), 3)) for multi-part freeform
    };

export function parseVNScene(sceneContent: string): VNBlock[] {
  const blocks: VNBlock[] = [];
  const lines = sceneContent.split('\n').filter(line => line.trim());

  console.log('=== PARSER START ===');
  console.log('Parsing scene content, total lines:', lines.length);

  let i = 0;
  while (i < lines.length) {
    const line = lines[i].trim();

    // Parse [narration] tags
    if (line.startsWith('[narration]')) {
      const content = line.replace('[narration]', '').trim();
      blocks.push({ type: 'narration', content });
      i++;
      continue;
    }

    // Parse [character:Name] [emotion] dialogue OR [character:Name] *emotion* dialogue
    // Prefer bracket format: [character:Anya] [thoughtful] Some dialogue
    // Also support asterisk format: [character:Anya] *thoughtful* Some dialogue
    const bracketEmotionMatch = line.match(/\[character:([^\]]+)\]\s*\[([^\]]+)\]\s*(.+)/);
    const asteriskEmotionMatch = line.match(/\[character:([^\]]+)\]\s*\*([^*]+)\*\s*(.+)/);

    if (bracketEmotionMatch) {
      const [, character, emotion, content] = bracketEmotionMatch;
      blocks.push({
        type: 'dialogue',
        character: character.trim(),
        content: content.trim(),
        emotion: emotion?.trim(),
      });
      i++;
      continue;
    }

    if (asteriskEmotionMatch) {
      const [, character, emotion, content] = asteriskEmotionMatch;
      blocks.push({
        type: 'dialogue',
        character: character.trim(),
        content: content.trim(),
        emotion: emotion?.trim(),
      });
      i++;
      continue;
    }

    // Character without emotion: [character:Name] dialogue
    // Default to 'neutral' emotion for sprite display
    const characterNoEmotionMatch = line.match(/\[character:([^\]]+)\]\s*(.+)/);
    if (characterNoEmotionMatch) {
      const [, character, content] = characterNoEmotionMatch;
      console.warn(`Dialogue without emotion tag at line ${i}, defaulting to 'neutral':`, content.substring(0, 50));
      blocks.push({
        type: 'dialogue',
        character: character.trim(),
        content: content.trim(),
        emotion: 'neutral', // Default emotion for sprite display
      });
      i++;
      continue;
    }

    // Parse [player_prompt] with options and branches
    if (line.startsWith('[player_prompt]')) {
      const prompt = line.replace('[player_prompt]', '').trim();
      const options: string[] = [];
      const optionLetters: string[] = [];

      console.log('Found player_prompt:', prompt);

      // Look ahead for options (lines starting with -, numbers, or **A., **B., etc.)
      let j = i + 1;
      while (j < lines.length) {
        const optionLine = lines[j].trim();
        console.log('Checking line for option:', optionLine);

        // Stop if we hit a new section (before processing)
        if (optionLine.startsWith('[') || optionLine.startsWith('##') || optionLine.startsWith('#')) {
          console.log('Hit new section, stopping option scan');
          break;
        }

        // Match format: "**A. Main option** – Explanation"
        const boldOptionMatch = optionLine.match(/^\*\*([A-Za-z])\.?\s+([^*]+)\*\*\s*[–-]?\s*(.*)$/);
        if (boldOptionMatch) {
          const [, letter, mainOption, explanation] = boldOptionMatch;
          // Include both main option and explanation if present
          const fullOption = explanation.trim()
            ? `${mainOption.trim()} – ${explanation.trim()}`
            : mainOption.trim();
          console.log(`Found option ${letter}:`, fullOption);
          options.push(fullOption);
          optionLetters.push(letter.toUpperCase());
          j++;
          continue;
        }

        // Match simpler formats: "A. option", "1. option", "- option"
        if (optionLine.match(/^[A-Za-z\d-]+[\.\)]\s+/) || optionLine.startsWith('-')) {
          let option = optionLine.replace(/^[A-Za-z\d-]+[\.\)]\s+/, '').trim();
          console.log('Found simple option:', option);
          options.push(option);
          j++;
          continue;
        }

        // Empty line - stop scanning
        if (optionLine.length === 0 || optionLine.match(/^\s*$/)) {
          break;
        }

        // Unknown format - skip and continue
        j++;
      }

      console.log('Total options found:', options.length, options);

      // Check for multi-part freeform (numbered sub-questions like 1), 2), 3))
      const subQuestions: SubQuestion[] = [];
      let k = j;
      while (k < lines.length) {
        const subQLine = lines[k].trim();

        // Stop if we hit branches or other content
        if (subQLine.startsWith('##') || subQLine.startsWith('[')) {
          break;
        }

        // Match numbered sub-questions: "1) Question text" or "1. Question text"
        const subQMatch = subQLine.match(/^(\d+)[\.\)]\s+(.+)$/);
        if (subQMatch) {
          const [, num, questionText] = subQMatch;
          console.log(`Found sub-question ${num}:`, questionText);
          subQuestions.push({
            partNumber: parseInt(num),
            questionText: questionText.trim(),
          });
          k++;
          continue;
        }

        // Empty line - might be between sub-questions
        if (subQLine.length === 0) {
          k++;
          continue;
        }

        // Non-matching line - stop scanning for sub-questions
        break;
      }

      const isMultiPartFreeform = subQuestions.length > 0;
      if (isMultiPartFreeform) {
        console.log('Detected multi-part freeform with', subQuestions.length, 'sub-questions');
        j = k; // Advance past sub-questions
      }

      // Now parse conditional branches (## Expected output — if student picks X)
      const branches: { [key: string]: VNBlock[] } = {};

      while (j < lines.length) {
        const branchLine = lines[j].trim();

        // Match "## Expected output — if student picks A" or "## Expected output - if student picks A"
        // But NOT "if student picks A then B" (nested branches)
        const branchMatch = branchLine.match(/^##\s*Expected output\s*[—-]\s*if student picks\s+([A-Z])(?:\s|$)/i);
        if (branchMatch) {
          const branchLetter = branchMatch[1].toUpperCase();
          console.log(`Found branch for option ${branchLetter}`);

          j++; // Move past the header
          const branchBlocks: VNBlock[] = [];

          // Parse blocks until we hit another SAME-LEVEL branch header
          // "A then B" headers should be ignored (they belong to nested prompts)
          while (j < lines.length) {
            const contentLine = lines[j].trim();

            // Check if this is a same-level branch (single letter after "picks")
            const sameLevelBranch = contentLine.match(/^##\s*Expected output\s*[—-]\s*if student picks\s+([A-Z])(?:\s|$)/i);
            if (sameLevelBranch) {
              // This is a sibling branch (B, C, etc.), stop parsing this branch
              break;
            }

            // Parse narration
            if (contentLine.startsWith('[narration]')) {
              const content = contentLine.replace('[narration]', '').trim();
              branchBlocks.push({ type: 'narration', content });
              j++;
              continue;
            }

            // Parse nested [player_prompt] with its own branches
            if (contentLine.startsWith('[player_prompt]')) {
              const nestedPrompt = contentLine.replace('[player_prompt]', '').trim();
              const nestedOptions: string[] = [];
              let m = j + 1;

              // Collect nested prompt options
              while (m < lines.length) {
                const optLine = lines[m].trim();
                if (optLine.startsWith('[') || optLine.startsWith('##') || optLine.startsWith('#')) {
                  break;
                }
                const boldOptionMatch = optLine.match(/^\*\*([A-Za-z])\.?\s+([^*]+)\*\*\s*[–-]?\s*(.*)$/);
                if (boldOptionMatch) {
                  const [, letter, mainOption, explanation] = boldOptionMatch;
                  const fullOption = explanation.trim()
                    ? `${mainOption.trim()} – ${explanation.trim()}`
                    : mainOption.trim();
                  nestedOptions.push(fullOption);
                  m++;
                  continue;
                }
                if (optLine.length === 0) {
                  m++;
                  continue;
                }
                break;
              }

              // Now parse nested branches (A then A, A then B, etc.)
              const nestedBranches: { [key: string]: VNBlock[] } = {};
              while (m < lines.length) {
                const nestedBranchLine = lines[m].trim();
                // Match "A then X" patterns for nested branches
                const nestedBranchMatch = nestedBranchLine.match(/^##\s*Expected output\s*[—-]\s*if student picks\s+[A-Z]\s+then\s+([A-Z])/i);
                if (nestedBranchMatch) {
                  const nestedLetter = nestedBranchMatch[1].toUpperCase();
                  m++;
                  const nestedBlocks: VNBlock[] = [];

                  // Parse nested branch content
                  while (m < lines.length) {
                    const nestedContent = lines[m].trim();
                    if (nestedContent.startsWith('##')) break;

                    if (nestedContent.startsWith('[narration]')) {
                      nestedBlocks.push({ type: 'narration', content: nestedContent.replace('[narration]', '').trim() });
                      m++;
                      continue;
                    }

                    const charMatch = nestedContent.match(/\[character:([^\]]+)\]\s*\[([^\]]+)\]\s*(.+)/);
                    if (charMatch) {
                      nestedBlocks.push({ type: 'dialogue', character: charMatch[1].trim(), content: charMatch[3].trim(), emotion: charMatch[2].trim() });
                      m++;
                      continue;
                    }

                    m++;
                  }

                  nestedBranches[nestedLetter] = nestedBlocks;
                  continue;
                }

                // Stop if we hit a same-level branch
                if (nestedBranchLine.match(/^##\s*Expected output\s*[—-]\s*if student picks\s+([A-Z])(?:\s|$)/i)) {
                  break;
                }

                m++;
              }

              // Add nested prompt with its branches
              branchBlocks.push({
                type: 'player_prompt',
                prompt: nestedPrompt,
                isMultiChoice: nestedOptions.length > 0,
                options: nestedOptions.length > 0 ? nestedOptions : undefined,
                branches: Object.keys(nestedBranches).length > 0 ? nestedBranches : undefined,
              });

              j = m;
              continue;
            }

            // Parse dialogue with bracket emotion: [character:Name] [emotion] text
            const bracketCharMatch = contentLine.match(/\[character:([^\]]+)\]\s*\[([^\]]+)\]\s*(.+)/);
            if (bracketCharMatch) {
              const [, character, emotion, content] = bracketCharMatch;
              branchBlocks.push({
                type: 'dialogue',
                character: character.trim(),
                content: content.trim(),
                emotion: emotion?.trim(),
              });
              j++;
              continue;
            }

            // Parse dialogue with asterisk emotion: [character:Name] *emotion* text
            const asteriskCharMatch = contentLine.match(/\[character:([^\]]+)\]\s*\*([^*]+)\*\s*(.+)/);
            if (asteriskCharMatch) {
              const [, character, emotion, content] = asteriskCharMatch;
              branchBlocks.push({
                type: 'dialogue',
                character: character.trim(),
                content: content.trim(),
                emotion: emotion?.trim(),
              });
              j++;
              continue;
            }

            // Parse dialogue without emotion: [character:Name] text
            const noEmotionCharMatch = contentLine.match(/\[character:([^\]]+)\]\s*(.+)/);
            if (noEmotionCharMatch) {
              const [, character, content] = noEmotionCharMatch;
              branchBlocks.push({
                type: 'dialogue',
                character: character.trim(),
                content: content.trim(),
              });
              j++;
              continue;
            }

            j++;
          }

          branches[branchLetter] = branchBlocks;
          console.log(`Branch ${branchLetter} has ${branchBlocks.length} blocks`);
          continue;
        }

        // Skip "# Expected output" headers or other markdown headers
        if (branchLine.startsWith('#')) {
          j++;
          continue;
        }

        // Stop if we've hit actual scene content again
        if (branchLine.startsWith('[character:') || branchLine.startsWith('[narration]') || branchLine.startsWith('[player_prompt]')) {
          break;
        }

        // Skip empty lines or other content
        j++;
      }

      const isMultiChoice = options.length > 0;
      const promptBlock = {
        type: 'player_prompt' as const,
        prompt,
        isMultiChoice,
        options: isMultiChoice ? options : undefined,
        branches: Object.keys(branches).length > 0 ? branches : undefined,
        isMultiPartFreeform,
        subQuestions: isMultiPartFreeform ? subQuestions : undefined,
      };

      console.log('=== PLAYER PROMPT BLOCK ===');
      console.log('Multi-part freeform:', isMultiPartFreeform);
      if (isMultiPartFreeform) {
        console.log('Sub-questions:', subQuestions);
      }
      console.log('Options:', options);
      console.log('Branches:', Object.keys(branches));
      Object.entries(branches).forEach(([key, branchBlocks]) => {
        console.log(`Branch ${key}: ${branchBlocks.length} blocks`);
        branchBlocks.forEach((block, idx) => {
          console.log(`  ${idx + 1}. ${block.type}: ${block.type === 'dialogue' ? block.content : block.type === 'narration' ? block.content : 'prompt'}`);
        });
      });

      blocks.push(promptBlock);

      i = j;
      continue;
    }

    // If no match, treat as narration (fallback)
    if (line && !line.startsWith('[') && !line.startsWith('-')) {
      blocks.push({ type: 'narration', content: line });
    }

    i++;
  }

  console.log('=== PARSER COMPLETE ===');
  console.log('Total blocks:', blocks.length);
  blocks.forEach((block, idx) => {
    console.log(`Block ${idx + 1}: ${block.type}`);
  });
  console.log('===================');

  return blocks;
}
