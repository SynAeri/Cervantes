# Architecture: Interactive Particle "Wheat Field"

This document outlines the technical implementation for a custom HTML5 Canvas-based particle system in React. The goal is to create a field of nodes that exhibit organic, heavy movement—repelling from the cursor and slowly settling back to their original positions.

---

## 1. Technical Stack
* **Framework:** React (Functional Components)
* **Rendering:** HTML5 Canvas API (2D Context)
* **Logic:** RequestAnimationFrame (60fps loop)
* **State:** Reference-based particle array (to bypass React re-render overhead)

---

## 2. Core Physics Logic

The simulation relies on three primary forces acting on each node at every frame: **Repulsion**, **Spring (Restoration)**, and **Friction**.

### A. The Particle Object
Each node is an object with the following properties:
* $(x, y)$: Current coordinates.
* $(originX, originY)$: The "home" position the node wants to return to.
* $(vx, vy)$: Velocity vectors.
* **Color:** Dynamic hex or HSL value based on proximity.

### B. Mathematical Formulas
To achieve the "wheat" effect, we use the following calculations per frame:

1.  **Distance to Mouse ($d$):**
    $$d = \sqrt{(x_{mouse} - x)^2 + (y_{mouse} - y)^2}$$

2.  **Repulsion Force ($F_r$):**
    If $d < radius$, the force is calculated to push the particle away:
    $$Force = \frac{radius - d}{radius}$$
    This creates a normalized value between $0$ and $1$.

3.  **Restoration Force (Spring):**
    The particle is pulled back to its origin. To make it "slow" and "heavy," we use a low spring constant ($k$):
    $$v_x += (originX - x) \cdot k$$
    $$v_y += (originY - y) \cdot k$$

4.  **Damping (Friction):**
    To prevent the nodes from oscillating forever like a spring, we apply a high friction coefficient ($\mu$):
    $$v_x \cdot= \mu$$
    $$v_y \cdot= \mu$$
    *(Suggested $\mu: 0.85$ to $0.92$)*

---

## 3. Component Architecture

### Component: `WheatField.tsx`
* **`useRef<HTMLCanvasElement>`**: Direct access to the DOM node.
* **`useRef<Particle[]>`**: Stores the particle array. We use a Ref instead of State to prevent React from trying to re-render the entire component 60 times per second.
* **`useEffect` (Initialization)**: 
    * Calculates the grid density based on window size.
    * Populates the particle array with slight random offsets ("jitter") for an organic look.
* **`useEffect` (The Loop)**:
    * Clears the canvas.
    * Updates particle positions based on the physics logic.
    * Draws the particles (small circles or short vertical lines).

---

## 4. Interaction Features

### Color Shifting
Rather than a binary color change, the color should be a function of the distance from the mouse. 
* **Base Color:** `#D2B48C` (Tan/Wheat)
* **Active Color:** `#F5DEB3` (Light Wheat)
* **Logic:** `ctx.fillStyle = interpolate(baseColor, activeColor, force)`

### Performance Optimization
* **Offscreen Canvas:** If node count exceeds 2,000, draw the static background once to an offscreen canvas.
* **Mouse Caching:** Only update mouse coordinates on `mousemove` and store them in a Ref to avoid expensive event lookups in the frame loop.

---

## 5. Execution Steps

1.  **Grid Setup:** Create a nested loop that places particles every 20-30 pixels.
2.  **Event Listeners:** Attach `mousemove` and `mouseleave` to the canvas to track cursor coordinates.
3.  **The Update Loop:** Implement the velocity and friction logic. Adjust the friction coefficient until the "bounce back" feels heavy and slow rather than snappy.
4.  **The Draw Loop:** Use `ctx.beginPath()` and `ctx.arc()` for each particle. For a "field" look, consider drawing a tiny line from $(x, y)$ to $(x, y + 5)$ instead of a dot.

> **Note:** For the most organic feel, ensure the `k` (restoration) value is significantly smaller than the repulsion force. This ensures the "push" is energetic but the "return" is lazy.
