
# RT-2: Vision-Language-Action Models Transfer Web Knowledge to Robotic Control


## The five fields

- Action representation: Same as RT-1, each action dimension discretized
into 256 uniform bins. KEY TWIST: action bins are encoded as tokens in
the VLM's existing text vocabulary by overwriting rarely-used tokens
(least-frequent ~256 token IDs become action bins). Model outputs
actions as if they were words. Same softmax, same cross-entropy, no
new heads.
- Backbone: Pretrained VLM. Two backbones tested: PaLI-X (5B and 55B
variants) and PaLM-E (12B). Headline results use PaLI-X 55B. All are
Google VLMs pretrained on massive web vision-language data.
- Data mixture: ~90% web vision-language data + ~10% robot data,
co-fine-tuned together. Co-training is critical, fine-tuning on robot
data alone causes catastrophic forgetting of VLM capabilities.
- Control freq / latency: ~5 Hz for the 5B variant, ~1-3 Hz for the 55B
variant served from a cloud TPU cluster. Slower than RT-1. Network
dependency for the big model. This is the major practical limitation.
- Central claim: A pretrained VLM can be turned into a robot policy by
encoding actions as tokens in its existing vocabulary and co-fine-tuning
on web + robot data, producing a single end-to-end model that outputs
actions while preserving the VLM's open-vocabulary recognition,
semantic reasoning, and world knowledge.

## What's new vs. PaLM-E

- Collapses PaLM-E's two-tier system (planner + low-level policy) into
one end-to-end model. No more brittle natural-language interface
between tiers.
- VLM directly outputs actions instead of text plans. The bridge is
action tokenization (inherited from RT-1).
- Demonstrates true out-of-distribution generalization: open-vocabulary
object recognition, semantic reasoning over instructions, and
common-sense world knowledge applied to action selection.
- Shows chain-of-thought reasoning works for action prediction, the
model can emit reasoning text _and then_ action tokens, inheriting
CoT from the LLM half.

## Key design choice + why


Encoding action tokens in the VLM's existing text vocabulary by
overwriting the 256 least-frequent token IDs. This means no architectural
change to the VLM, same transformer, same softmax, same loss. Action
prediction becomes "the VLM speaks a slightly extended language." This
is what makes co-fine-tuning straightforward and prevents the architectural
seams that would otherwise cause forgetting or interference.


## Most important findings

1. Emergent capabilities: RT-2 succeeds on tasks RT-1 cannot, picking
the "extinct animal" (toy dinosaur), moving things relative to
pictures of celebrities, recognizing objects never seen in robot
data. These come from web pretraining preserved through co-training.
2. Co-fine-tuning >> fine-tuning on robot data alone. Pure robot
fine-tuning destroys the VLM's general capabilities (catastrophic
forgetting). Web data must be in the mixture to preserve them.
3. Chain-of-thought generalization. Prompting RT-2 to "think first,
then act" yields better action selection on multi-step or
ambiguous tasks. The model's reasoning capability transfers from
text to action contexts.
4. Scale helps. PaLI-X 55B beats 5B beats 12B PaLM-E on most metrics,
especially on tasks requiring semantic generalization.

## Limitations

- Inference speed: 1-3 Hz for the 55B model, served from cloud TPUs.
Too slow for reactive, high-frequency, or high-precision control.
This single limitation drives most of the next two years of VLA
research (action chunking, diffusion heads, flow matching, dual-system
architectures).
- Motor primitives still bounded by robot training distribution. RT-2
generalizes semantically (new objects, new instructions) but not
physically (new skills, new motion types).
- Web knowledge can occasionally leak destructively, model reasons
in ways that hurt action prediction.
- Closed source. PaLI-X 55B never released. Motivates OpenVLA as the
open replication.

[http://arxiv.org/abs/2307.15818](http://arxiv.org/abs/2307.15818)

