
# OpenVLA: An Open-Source Vision-Language-Action Model


## The five fields

- Action representation: Same RT-1/RT-2 scheme, each action dimension
discretized into 256 uniform bins, encoded as tokens in the LLM's
vocabulary by overwriting the 256 least-used Llama tokens. Refined
selection of which tokens to overwrite (avoid semantically meaningful
ones). 7-DoF end-effector deltas + gripper.
- Backbone: Prismatic VLM framework. Vision: DINOv2 + SigLIP features
fused (DINOv2 = spatial/geometric, SigLIP = semantic; concatenated
before projection). Language: Llama 2 7B. Total ~7B params, runnable
on a single A100 (or consumer GPU with quantization).
- Data mixture: ~970k episodes from Open-X Embodiment, spanning 22
robot platforms. Pure robot data no web co-training in the main
recipe. Open-X breadth substitutes for the diversity web data
provided in RT-2.
- Control freq / latency: ~6 Hz native inference on an A100. Higher
with quantization and batching. Crucially deployable on local
hardware no cloud dependency.
- Central claim: A 7B parameter open-source VLA, built from open
components (Llama 2 + DINOv2 + SigLIP) and trained on the open
Open-X dataset, can match or exceed Google's closed 55B RT-2-X
demonstrating that data scale and modern open components matter
more than raw model size, and that VLAs can be reproduced and
fine-tuned by anyone.

## What's new vs. RT-2

- 8× smaller (7B vs. 55B) and outperforms RT-2-X on standard
manipulation benchmarks.
- Fully open: open weights, open training code, open data (Open-X),
open backbone components. Anyone can reproduce, fine-tune, deploy.
- Trained on Open-X (970k episodes, 22 embodiments) instead of
Google-internal robot data more diverse, larger.
- Uses dual vision encoders (DINOv2 + SigLIP fusion) instead of a
single PaLI-style encoder. Spatial + semantic features combined.
- Built on the open-source LLM ecosystem (Llama 2), inheriting all
the standard tooling: HuggingFace, LoRA, quantization, etc.
- Demonstrates LoRA fine-tuning on a single A100 as the standard
adaptation recipe turns "deploy a VLA" into a tractable
engineering project.

## Key design choice + why


Choosing Llama 2 7B as the language backbone (via Prismatic). This
single decision plugs OpenVLA into the entire open-source LLM
ecosystem fine-tuning libraries, quantization tools, inference
frameworks, community knowledge. It's why OpenVLA became _the_
default starting point for robotics teams adapting VLAs, rather
than just another research artifact. The model's success is
inseparable from the ecosystem it joined.


## Most important findings

1. 7B open beats 55B closed. OpenVLA outperforms RT-2-X across most
manipulation benchmarks despite being ~8× smaller. Implication:
data scale and modern components dominate raw model size.
2. LoRA fine-tuning works. Parameter-efficient fine-tuning on a
single A100 adapts OpenVLA to new robots and tasks effectively.
No full fine-tune required for downstream adaptation.
3. Quantization is feasible. 4-bit quantization preserves performance
well, enabling consumer-GPU deployment.
4. Dual vision encoders (DINOv2 + SigLIP) outperform either alone.
Ablation supports the spatial + semantic split.
5. Open-X data is enough. Pure robot data at sufficient scale and
diversity replaces the need for explicit web co-training (the
web knowledge is already baked into Llama 2 and SigLIP via
their pretraining).

## Limitations

- Inference speed still a concern (~6 Hz). Better than RT-2 but not
fast enough for high-frequency or reactive control. Same fundamental
problem RT-2 had, somewhat alleviated by smaller size.
- Autoregressive token decoding is the bottleneck predicting 7
action tokens sequentially per timestep is intrinsically slow.
Motivates continuous action heads (Octo, π0).
- Motor primitives still bounded by Open-X distribution. Inherits
RT-2's "semantic generalization yes, motor generalization no"
limitation.
- No action chunking in the base model. Each forward pass produces
one timestep's worth of actions. Later VLAs amortize forward
passes across chunks for higher effective control rates.
- Co-training with web data is not done in the main recipe could
potentially help further, as later π0.5 demonstrates.

[http://arxiv.org/abs/2406.09246](http://arxiv.org/abs/2406.09246)

