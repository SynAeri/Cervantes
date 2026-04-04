<!DOCTYPE html>

<html class="dark" lang="en"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>The Modern Chronologist - Visual Novel UI</title>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600&amp;family=Space+Grotesk:wght@300;400;500;700&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<script id="tailwind-config">
        tailwind.config = {
            darkMode: "class",
            theme: {
                extend: {
                    "colors": {
                        "tertiary": "#f3faff",
                        "on-tertiary": "#546167",
                        "on-surface": "#e7e5e5",
                        "tertiary-container": "#dfedf5",
                        "surface-container": "#191a1a",
                        "error-container": "#7f2927",
                        "on-tertiary-container": "#4b595f",
                        "on-error-container": "#ff9993",
                        "tertiary-fixed-dim": "#d1dfe6",
                        "on-secondary": "#09232d",
                        "primary-dim": "#ff9e9d",
                        "tertiary-fixed": "#dfedf5",
                        "surface-container-low": "#131313",
                        "inverse-surface": "#fcf9f8",
                        "error-dim": "#bb5551",
                        "surface-variant": "#252626",
                        "inverse-primary": "#a03f41",
                        "on-secondary-fixed-variant": "#475f6a",
                        "surface-bright": "#2b2c2c",
                        "on-primary": "#782025",
                        "error": "#ee7d77",
                        "surface-container-lowest": "#000000",
                        "surface-container-high": "#1f2020",
                        "secondary": "#89a1ae",
                        "on-tertiary-fixed-variant": "#556369",
                        "secondary-fixed-dim": "#bfd8e5",
                        "secondary-fixed": "#cde6f4",
                        "outline": "#767575",
                        "surface-container-highest": "#252626",
                        "on-secondary-fixed": "#2b424d",
                        "secondary-container": "#273f49",
                        "on-tertiary-fixed": "#39474c",
                        "primary-container": "#80272b",
                        "primary-fixed-dim": "#ffc7c5",
                        "outline-variant": "#484848",
                        "on-secondary-container": "#aac3d0",
                        "on-primary-container": "#ffc1bf",
                        "surface": "#0e0e0e",
                        "on-surface-variant": "#acabaa",
                        "secondary-dim": "#89a1ae",
                        "on-background": "#e7e5e5",
                        "tertiary-dim": "#d1dfe6",
                        "surface-tint": "#ffb3b1",
                        "surface-dim": "#0e0e0e",
                        "inverse-on-surface": "#565555",
                        "primary-fixed": "#ffdad8",
                        "on-primary-fixed": "#761f24",
                        "on-error": "#490106",
                        "primary": "#ffb3b1",
                        "on-primary-fixed-variant": "#9c3b3e",
                        "background": "#0e0e0e"
                    },
                    "borderRadius": {
                        "DEFAULT": "0.125rem",
                        "lg": "0.25rem",
                        "xl": "0.5rem",
                        "full": "0.75rem"
                    },
                    "fontFamily": {
                        "headline": ["Space Grotesk"],
                        "body": ["Plus Jakarta Sans"],
                        "label": ["Space Grotesk"]
                    }
                },
            },
        }
    </script>
<style>
        .material-symbols-outlined {
            font-variation-settings: 'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 20;
        }
        .text-glow {
            text-shadow: 0 0 12px rgba(255, 179, 177, 0.4);
        }
        .dialogue-overlay {
            background: linear-gradient(to top, 
                rgba(0,0,0,0.95) 0%, 
                rgba(0,0,0,0.85) 60%, 
                rgba(0,0,0,0.4) 85%, 
                transparent 100%);
        }
        .name-plate-accent::before,
        .name-plate-accent::after {
            content: "";
            height: 1px;
            width: 60px;
            background: rgba(255,255,255,0.2);
            display: inline-block;
            vertical-align: middle;
            margin: 0 15px;
        }
    </style>
</head>
<body class="bg-background text-on-surface font-headline overflow-hidden selection:bg-primary/30 selection:text-primary min-h-screen">
<!-- Background Cinematic Layer -->
<div class="fixed inset-0 z-0">
<img alt="Cinematic background" class="w-full h-full object-cover grayscale-[0.1] brightness-75" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCeqi8VBV0o_QELWaPN9Mqj3PvFt6zHqM3m9ZbStvyDg8swHPmFFJfAqsy5IqEtj3_ELyn97sN7Ut9-6KpDyq8aNwTZyCNxy2GiwUYkiFIyXqXI8BjNDjhcmXiFP1OvD74VAE0OKlB8CWPNHBTYibrScaKqXhKu9HKrfPX-EFe5Ju7fjaVDvzevBB5iQ5v6SpFB0mh8kNq0DHqR0lXkqv8wg_ZBJuO9u6pwdjgPLyvNhTsTG-9hK6BhvIEIwDTbYgBUtACyyOMDv4tq"/>
<div class="absolute inset-0 bg-black/20"></div>
</div>
<!-- Top HUD -->
<header class="fixed top-6 left-6 z-50 flex items-center px-4 py-1.5 gap-4 bg-stone-900/60 backdrop-blur-md border border-white/10 font-headline tracking-tighter rounded-sm">
<div class="flex items-center gap-2 text-white">
<span class="text-lg font-bold">7/28</span>
<span class="text-[10px] opacity-70">(WED)</span>
</div>
<div class="w-px h-3 bg-white/20"></div>
<div class="flex items-center gap-2">
<span class="material-symbols-outlined text-[14px] opacity-60">battery_full_alt</span>
<span class="material-symbols-outlined text-[14px] opacity-60">signal_cellular_alt</span>
</div>
</header>
<!-- Main Dialogue UI -->
<main class="fixed inset-0 z-10 flex flex-col justify-end">
<!-- Dialogue Container - Height reduced to 1/3 ~ 1/4 of screen -->
<div class="dialogue-overlay w-full pt-16 pb-6 px-0 bg-black/60 backdrop-blur-sm">
<div class="max-w-4xl mx-auto px-4 md:px-8 text-center">
<!-- Dialogue Text (Small Font Size with horizontal leeway) -->
<p class="text-white/95 leading-relaxed font-light mb-4 min-h-[60px] mx-auto text-xs md:text-sm px-6 md:px-24">
                    "Wait. You're saying the <span class="text-primary-dim font-medium text-glow italic">divergence meter</span> hasn't fluctuated at all since we arrived?" 
                    She crossed her arms, her gaze shifting toward the terminal screen. "That shouldn't be possible according to the <span class="text-primary-dim font-medium text-glow">Attractor Field</span> theory."
                    <span class="inline-flex gap-1 ml-2 opacity-40">
<span class="material-symbols-outlined text-[10px] animate-pulse">keyboard_double_arrow_right</span>
</span>
</p>
<!-- Name and Controls Container -->
<div class="flex flex-col items-center gap-4">
<!-- Character Name (Centered) -->
<div class="name-plate-accent text-white/80 text-[10px] tracking-[0.4em] uppercase font-light">
                        Kurisu
                    </div>
<!-- Shortened Bottom Selection Bar -->
<nav class="flex items-center justify-center gap-10 py-1 w-full max-w-sm border-t border-white/10">
<button class="group flex flex-col items-center">
<span class="material-symbols-outlined text-base text-white/50 group-hover:text-white transition-colors">auto_stories</span>
<span class="text-[7px] uppercase tracking-widest text-white/30 group-hover:text-white/70 mt-1">Journal</span>
</button>
<button class="group flex flex-col items-center">
<span class="material-symbols-outlined text-base text-white/50 group-hover:text-white transition-colors">list_alt</span>
<span class="text-[7px] uppercase tracking-widest text-white/30 group-hover:text-white/70 mt-1">Log</span>
</button>
<button class="group flex flex-col items-center">
<span class="material-symbols-outlined text-base text-white/50 group-hover:text-white transition-colors">calendar_today</span>
<span class="text-[7px] uppercase tracking-widest text-white/30 group-hover:text-white/70 mt-1">Calendar</span>
</button>
<button class="group flex flex-col items-center">
<span class="material-symbols-outlined text-base text-white/50 group-hover:text-white transition-colors">accessibility_new</span>
<span class="text-[7px] uppercase tracking-widest text-white/30 group-hover:text-white/70 mt-1">Accessibility</span>
</button>
</nav>
</div>
</div>
</div>
</main>
</body></html>
