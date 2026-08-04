
# PaLM-E: An Embodied Multimodal Language Model


## The five fields

- Action representation: None at the PaLM-E level, outputs natural-language
plans (e.g., "1. pick up red block. 2. place on green block."). A separate
low-level policy (often RT-1-style) parses each step and produces actual
joint commands. Two-tier system: PaLM-E plans, low-level executor moves.
- Backbone: Pretrained PaLM as the LLM (8B / 62B / 540B variants). ViT (4B or
22B) for image encoding, plus small MLPs for robot state. Each modality
passes through a learned projector that maps encoder outputs into the LLM's
embedding space; resulting vectors are spliced into the input sequence at
special placeholder token positions. LLM often kept frozen, only encoders
and projectors learn ("input-conditioned soft prompting").
- Data mixture: ~9% embodied/robot data, ~91% internet vision-language data
(image captioning, VQA, etc.). Heavy co-training is the whole point.
- Control freq / latency: PaLM-E is invoked event-driven (once per high-level
step), not on a clock. Low-level policy below it runs at ~3 Hz. PaLM-E is
the slow, deliberate planner; the low-level policy is the fast reactive
controller. (System 2 / System 1 framing.)
- Central claim: A pretrained LLM can be turned into an embodied multimodal
reasoner by injecting image and state observations as vectors at placeholder
token positions, and co-training with abundant web data improves robot
task performance, positive transfer rather than dilution.

## What's new vs. RT-1

- Inverts the language/vision relationship: RT-1 fused a small language
embedding (USE) into a vision policy via FiLM. PaLM-E makes the LLM the
substrate and injects vision and robot state into it.
- Brings massive scale and general world knowledge into robotics for the
first time (540B params).
- Splits the system into two tiers: high-level reasoning in PaLM-E, low-level
control in a separate policy. End-to-endness from RT-1 is sacrificed.
- Establishes that web data + robot data co-training improves robot
performance ("positive transfer") — RT-1 only used robot data.

## Key design choice + why


Freezing the LLM and training only the encoder + projector. The encoder
learns to produce vectors that the frozen LLM can interpret — effectively
turning images and robot state into "soft prompts" the LLM reads. This
preserves PaLM's full pretrained reasoning ability (no catastrophic
forgetting) and makes training tractable on a 540B model. The framing of
"the encoder is a learned prompt generator" is influential across all
later VLAs.


## Most important findings

1. Positive transfer / co-training: training on the web-heavy mixture
outperforms training on robot data alone, on the robot tasks themselves.
The effect is bigger at larger model scales.
2. Frozen-LLM setup works surprisingly well, especially at 540B scale.
You can adapt a giant pretrained LLM to robotics by training only a
small encoder + projector.
3. Generalization to novel objects and tasks is meaningfully better than
robotics-specific baselines, attributed to the LLM's web-scale knowledge.
4. Cross-embodiment results: a single PaLM-E can be trained across multiple
robot platforms simultaneously, with positive transfer between them.

## Limitations (motivate RT-2)

- Brittle natural-language interface between tiers. PaLM-E says "nudge
the cup," low-level policy may not know that word. Knowledge in the
LLM only reaches the robot through what fits in a parseable instruction.
- Rich world knowledge in the LLM (physics, materials, fragility) is
trapped on the wrong side of the language interface, can't directly
shape low-level actions.
- Two separately trained models, no joint gradients, no shared
representations, more operational complexity.
- PaLM-E itself never produces actions, so it inherits all the limits
of whatever low-level policy you pair it with.

[http://arxiv.org/abs/2303.03378](http://arxiv.org/abs/2303.03378)

