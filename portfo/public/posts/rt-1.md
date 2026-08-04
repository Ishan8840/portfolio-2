
# RT-1: Robotics Transformer for Real-World Control at Scale


## The five fields

- Action representation: Each of 11 action dims (7 arm: x/y/z/roll/pitch/yaw/
gripper, 3 base: x/y/yaw, 1 mode: arm/base/terminate) discretized into
256 uniform bins. Each timestep → 11 tokens, vocab size 256. Predicted
autoregressively with cross-entropy. Continuous command at inference =
bin center.
- Backbone: Image → FiLM-conditioned EfficientNet-B3 (ImageNet pretrained)
→ TokenLearner (81 → 8 tokens/frame) → decoder-only Transformer (~35M
params). Language: Universal Sentence Encoder embedding, injected into
EfficientNet via FiLM (early fusion).
- Data: 130k human-teleoperated episodes, 700+ language-conditioned tasks,
13 EDR mobile manipulators, 17 months of collection. Mostly pick-and-
place variants in office-kitchen scenes.
- Control freq / latency: 3 Hz closed-loop. History of 6 frames per
forward pass. TokenLearner compression is what makes 3 Hz feasible
(saves quadratic attention cost over 6×81 = 486 tokens).
- Central claim: Behavior cloning yields a generalist robot policy when you
(a) tokenize actions discretely, (b) compress visual tokens for inference
speed, and (c) prioritize data diversity over quantity.

## What's new vs. prior work

- First demonstration that a single transformer policy, trained via pure
imitation on a large diverse robot dataset, generalizes meaningfully to
new tasks/objects/scenes within the same embodiment.
- Establishes action tokenization as the standard recipe (every later VLA
inherits some version of this).
- Establishes that data diversity > data quantity for generalization in
imitation learning.

## Key design choice + why


Discretizing continuous actions into 256-bin tokens. This collapses robot
control into next-token prediction, making the entire transformer / cross-
entropy / sampling stack work directly with no special heads or losses.
It's also what makes RT-2 possible a year later: once actions are tokens,
a pretrained VLM can predict them with no architectural changes.


## Most important ablation findings

1. Data diversity > data quantity. Halving diversity hurts generalization
more than halving quantity. Drives the entire field's emphasis on data
coverage afterward.
2. Discrete actions > continuous regression. Tokenized actions with cross-
entropy outperform MSE regression on continuous values.
3. ImageNet pretraining matters a lot. From-scratch vision encoder
underperforms significantly. Foreshadows the "always start from a
pretrained foundation" pattern of later VLAs.
4. Scales with model size, but only up to a point given fixed data,
diversity is the binding constraint.

## Limitations (per the paper)

- Cannot exceed demonstration quality (fundamental BC limitation; motivates
RL post-training in π0.6).
- Cannot generalize to genuinely new motions/skills, only new combinations
of seen primitives (motivates VLM-based knowledge transfer in RT-2).
- Reactive only, no long-horizon planning or memory beyond the 6-frame
context window.
- Sample-inefficient relative to humans; data collection remains the
bottleneck.

[http://arxiv.org/abs/2212.06817](http://arxiv.org/abs/2212.06817)

