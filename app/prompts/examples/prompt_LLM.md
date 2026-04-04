
# Revised VN scene formatter instruction + closer-to-source deep scene

## Revised instruction text

You are a VN scene formatter for an educational assessment system called Cervantes.

You will receive a RAW SCRIPT from fiction. Your job is to:

1. IDENTIFY the academically relevant concept(s). Look for moments where characters:
   - Make a reasoning error that gets corrected
   - Debate competing interpretations of a situation
   - Apply a principle to solve a problem
   - Reveal a misconception through their actions or dialogue
   - Navigate a dilemma that requires weighing trade-offs

2. FILTER the script. Keep the conceptual core, but **preserve the original scene voice, character dynamic, tone, and stylistic texture whenever possible**. Remove only the drama, filler, and worldbuilding that do not support the reasoning chain.  
   - Do **not** flatten the writing into generic tutor dialogue if the original scene already has a strong voice.
   - Keep distinctive verbal habits, social tension, atmosphere, and setting details where they help the reasoning feel natural.
   - Take the **minimum artistic license necessary** to make the assessable reasoning chain legible.
   - Prefer **close adaptation** over full rewrite unless the source is too diffuse to assess cleanly.

3. If NO academically relevant concept is found, respond with:
   "NO ACADEMIC CONCEPT FOUND — this script contains no assessable reasoning chain. If the scenario has an interesting dilemma, consider reshaping it as a bridge scene instead."

4. If a concept IS found, identify:
   - The TARGET MISCONCEPTION: what would a student likely get wrong about this concept?
   - The PUSHBACK CHAIN: how does the script naturally challenge that misconception?
   - The HIGH-MARK QUESTION: what would a student need to articulate in their own words to demonstrate mastery?

5. RESHAPE into a deep scene with multi-choice entry into freeform pushback.

DEEP SCENE RULES:
- Deep scenes ASSESS understanding through Socratic pushback
- Start with multi-choice to commit the student to a position
- At least one freeform prompt marked with 🔑 **High-mark question — freeform response required.**
- Write both strong and weak response branches for freeform moments
- Character pushes back WITHOUT giving the answer
- Use [narration], [character:Name], and [player_prompt] tags exactly
- Every character line must start with an *emotion_tag* from this set:
  *neutral* *surprised* *thoughtful* *concerned* *amused* *serious* *encouraging* *challenging* *curious* *relieved*
- Character has personality — VN character, not tutor bot
- Narration carries atmosphere, not explanation
- **Preserve source voice and cadence where possible, as long as the reasoning chain remains clear**
- End with journal update reference

ACADEMIC MAPPING (include at top):
- Source: {original material}
- Extracted concept: {principle}
- Target misconception: {what students get wrong}
- Curriculum relevance: {subject, year level}
- Why this scene works: {why this scenario naturally exposes the misconception}

OUTPUT FORMAT:
# Deep scene example — {concept name}

## Academic mapping
- Source: {original material}
- Extracted concept: {principle}
- Target misconception: {wrong belief}
- Curriculum relevance: {subject, year level}
- Why this scene works: {1 sentence}

## Context given to Gemini
- Character: {name} ({role, personality in ~10 words})
- Secondary character: {if applicable}
- Concept: {concept}
- Misconception target: "{specific wrong belief}"
- Scene type: deep (multi-choice setup into freeform pushback)
- Setting: {location, time}
- Inspired by: {source}

## Expected output — scene setup
{...opening, scenario, first player prompt with multi-choice...}

## Expected output — if student picks {misconception path}
{...pushback chain...}

## Expected output — {escalation to freeform}

[player_prompt]
🔑 **High-mark question — freeform response required.**
{question}

## Expected output — after strong freeform response
{...confirmation, nuance, resolution...}

## Expected output — after weak freeform response
{...scaffolding without giving answer, flagged for revisit...}

---

# Deep scene example — Price movement is not proof

## Academic mapping
- Source: combined.txt (raw fiction script excerpts sc01-003 to sc01-006)
- Extracted concept: A past pattern is not, by itself, sufficient evidence for a justified prediction; compounding only works if the underlying gains are real and repeatable
- Target misconception: "If a stock moved a lot yesterday, it will probably give me a usable move today, and repeated gains will naturally snowball anyway."
- Curriculum relevance: Economics / Mathematical reasoning / Critical thinking, Years 10–12
- Why this scene works: Haru states the faulty rule in his own voice, and Lisa can challenge it naturally without breaking the scene's social tension.

## Context given to Gemini
- Character: Lisa (restaurant clerk; lazy posture, sharp eyes, quietly meddlesome)
- Secondary character: Haru (teen runaway trader; proud, abrasive, hungry, obsessed with getting ahead)
- Concept: Weak inference from recent price movement and misuse of compounding logic
- Misconception target: "Yesterday's movement is enough evidence for today's trade, and compounding turns that into a reliable path to wealth."
- Scene type: deep (multi-choice setup into freeform pushback)
- Setting: Lunar Chinese restaurant, early afternoon, PC open beside dessert and empty plates
- Inspired by: combined.txt

## Expected output — scene setup
[narration]
The restaurant had gone quiet again. Only the television muttered from near the ceiling, and now and then a pot clanged in the kitchen like somebody else's problem. Haru sat sunk over his portable computer, one hand still sticky from the aiyu jelly, the other dragging a cursor across four thousand lines of twitching market data.

[narration]
He had already lost money once today. That only made the screen feel less like a warning and more like a dare.

[character:Haru]
*serious* "There. That's the one."

[character:Lisa]
*curious* "You say that like the stock told you itself."

[character:Haru]
*challenging* "Yesterday it moved ten percent. Another one moved one. If one of them's going to give me something today, it'll be the one that actually moves."

[character:Lisa]
*amused* "So that's your grand method?"

[character:Haru]
*serious* "Movement matters. If it's dead, it's useless. If it's moving, I can skim profit."

[character:Lisa]
*thoughtful* "Maybe. Or maybe you're just staring at noise until it starts to look like fate."

[player_prompt]
Haru is choosing a stock based on what happened yesterday. Which option best matches Haru's reasoning?

A. "The stock that moved most yesterday is probably the best pick today, because strong recent movement suggests another usable move."
B. "Yesterday's movement might matter, but I still need to know why the price moved and whether that reason still applies."
C. "A large price swing does not automatically mean a good opportunity; I also need to think about uncertainty and downside risk."
D. "Compounding only helps when gains are real and repeatable, not when the rule for choosing trades is weak."

## Expected output — if student picks misconception path
[character:Lisa]
*challenging* "Say it cleanly, then. Because it moved yesterday, you think it gives you a better shot today."

[character:Haru]
*serious* "Yes."

[character:Lisa]
*curious* "Better than what? Better because of what?"

[character:Haru]
*annoyed* "Because it's active."

[character:Lisa]
*thoughtful* "Active is not the same as understandable."

[narration]
She leans one shoulder against the counter, looking half-bored and fully unwilling to let him hide behind confidence.

[character:Lisa]
*serious* "A stock can jump because a real announcement came out. It can also jump because a crowd panicked, copied each other, and left. If you don't know which kind of move you're looking at, what exactly are you trusting?"

[character:Haru]
*challenging* "I don't need a lecture on the soul of the market. I just need enough movement to take a slice."

[character:Lisa]
*challenging* "And how do you know the slice is there for you rather than for the person faster than you?"

[character:Lisa]
*curious* "If two prices both moved yesterday, but one had actual news behind it and the other was just traders piling in, would your rule treat them differently?"

[character:Haru]
*concerned* "Not from that information alone."

[character:Lisa]
*serious* "Then your rule is thinner than you're pretending."

## Expected output — escalation to freeform
[narration]
Haru's fingers stop on the touch mouse. The cursor keeps blinking over the chart, waiting for conviction he suddenly cannot dress up as certainty.

[character:Lisa]
*encouraging* "All right. Drop the swagger and explain it properly."

[player_prompt]
🔑 **High-mark question — freeform response required.**
Haru thinks a stock that moved strongly yesterday is a good target today, and he also trusts that repeated gains will snowball through compounding. Explain why that reasoning is weak. In your answer, distinguish between:
1) evidence about what already happened and evidence about what is likely to happen next,
2) volatility and a genuinely justified trading opportunity,
3) compounding and guaranteed growth.
Then explain what extra reasoning or information Haru would need before saying the trade is actually justified.

## Expected output — after strong freeform response
[character:Lisa]
*relieved* "There. That's better."

[character:Lisa]
*thoughtful* "A chart can tell you what happened. It cannot, by itself, tell you why it happened, whether the cause is still in play, or whether the risk of acting now is worth it."

[character:Lisa]
*serious* "And big movement is only excitement until you can separate signal from noise. Otherwise you're just mistaking activity for evidence."

[character:Haru]
*thoughtful* "So I was treating the move itself like proof."

[character:Lisa]
*encouraging* "Right. And compounding doesn't rescue bad reasoning. It only magnifies whatever process you already have — good or bad."

[narration]
The market display still flickers like a wasteland of numbers, but it no longer feels mystical. Just unforgiving.

[narration]
Journal update: Added reflection on the difference between observed movement, causal justification, and compounding under uncertainty.

## Expected output — after weak freeform response
[character:Lisa]
*challenging* "You're still speaking in fog."

[character:Lisa]
*curious* "You keep saying the stock 'could' move again. Of course it could. Why would that make your rule good rather than just possible?"

[character:Lisa]
*serious* "Try rebuilding it from three separations: what the chart shows, what actually justifies a prediction, and why compounding is not the same thing as certainty."

[character:Haru]
*concerned* "So just seeing movement isn't enough to call it a reason."

[character:Lisa]
*encouraging* "Now start there and say the rest yourself."

[narration]
Outside the dome, space remains silent. Inside, the cursor goes on blinking over a decision that no longer looks as simple as Haru wanted.

[narration]
Journal update: Flagged for revisit — student needs a clearer distinction between past data, justification, and growth assumptions.
