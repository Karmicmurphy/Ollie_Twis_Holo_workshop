# Media Generation Layer

## Purpose

The Media Generation Layer lets Twis Holo Workshop coordinate image, video, animation, audio, and storyboard generation without making the core app heavy, unsafe, or dependent on one model runtime.

## Core principle

Generation engines are tools. They are not memory. They are not Canon. They are not source authority.

## Artifact flow

1. Human creates prompt, source packet, storyboard, or image reference.
2. Workshop creates a generation request.
3. Human reviews request details.
4. Adapter receives request.
5. Adapter returns output path or file.
6. Workshop imports output as generated artifact.
7. Workshop writes receipt.
8. Human may mark it draft, derived, review needed, rejected, or candidate.

## Generation request types

- `text-to-image`
- `image-to-image`
- `inpaint`
- `upscale`
- `text-to-video`
- `image-to-video`
- `video-to-video`
- `storyboard-to-shots`
- `shot-plan`
- `animation-plan`
- `audio-reactive-plan`

## Human approval required

Always require confirmation before:

- sending private source text
- sending personal photos
- sending Cheryl/Randy/family/pet images
- sending local file paths
- using paid cloud generation
- publishing generated media
- storing output as Canon
- training LoRA or custom style models

## Default adapter status

All generation adapters start disabled unless they are built-in non-AI tools such as canvas editing and storyboard planning.
