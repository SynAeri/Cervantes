// VN scene parser - parses scene content with [tags] into structured blocks
// Handles [narration], [character:Name] *emotion*, [player_prompt] tags

export type VNBlock =
  | { type: 'narration'; content: string }
  | { type: 'dialogue'; character: string; content: string; emotion?: string }
  | { type: 'player_prompt'; isMultiChoice: boolean; options?: string[]; prompt: string };

export function parseVNScene(sceneContent: string): VNBlock[] {
  const blocks: VNBlock[] = [];
  const lines = sceneContent.split('\n').filter(line => line.trim());

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

    // Parse [character:Name] *emotion* dialogue
    const characterMatch = line.match(/\[character:([^\]]+)\]\s*(?:\*([^*]+)\*)?\s*(.+)/);
    if (characterMatch) {
      const [, character, emotion, content] = characterMatch;
      blocks.push({
        type: 'dialogue',
        character: character.trim(),
        content: content.trim(),
        emotion: emotion?.trim(),
      });
      i++;
      continue;
    }

    // Parse [player_prompt] with options
    if (line.startsWith('[player_prompt]')) {
      const prompt = line.replace('[player_prompt]', '').trim();
      const options: string[] = [];

      // Look ahead for options (lines starting with - or numbers)
      let j = i + 1;
      while (j < lines.length) {
        const optionLine = lines[j].trim();
        if (optionLine.match(/^[-\d]+[\.\)]\s+/)) {
          const option = optionLine.replace(/^[-\d]+[\.\)]\s+/, '').trim();
          options.push(option);
          j++;
        } else {
          break;
        }
      }

      const isMultiChoice = options.length > 0;
      blocks.push({
        type: 'player_prompt',
        prompt,
        isMultiChoice,
        options: isMultiChoice ? options : undefined,
      });

      i = j;
      continue;
    }

    // If no match, treat as narration (fallback)
    if (line && !line.startsWith('[') && !line.startsWith('-')) {
      blocks.push({ type: 'narration', content: line });
    }

    i++;
  }

  return blocks;
}
