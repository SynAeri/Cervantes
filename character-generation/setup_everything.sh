#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMFY_DIR="$ROOT_DIR/ComfyUI"
VENV_DIR="$ROOT_DIR/venv"
CUSTOM_NODES_DIR="$COMFY_DIR/custom_nodes"
VNCCS_DIR="$CUSTOM_NODES_DIR/ComfyUI_VNCCS"
MANAGER_DIR="$CUSTOM_NODES_DIR/ComfyUI-Manager"
MODELS_DIR="$COMFY_DIR/models"
TMP_DIR="$ROOT_DIR/tmp"
VNCCS_HF_REPO_DIR="$ROOT_DIR/vnccs_hf_repo"
COMFY_PORT=8188
PYTHON_BIN="${PYTHON_BIN:-python3.12}"

DOWNLOAD_FULL_VNCCS_MODELS=1
DOWNLOAD_ILLUSTRIOUS=1
HF_TOKEN="${HF_TOKEN:-}"

mkdir -p "$TMP_DIR"

echo
echo "========================================================"
echo "Full ComfyUI + VNCCS setup starting"
echo "========================================================"
echo "Root folder: $ROOT_DIR"
echo "ComfyUI dir: $COMFY_DIR"
echo "Venv dir   : $VENV_DIR"
echo

command -v git >/dev/null 2>&1 || { echo "ERROR: git is not installed."; exit 1; }
(command -v git-lfs >/dev/null 2>&1 || git lfs version >/dev/null 2>&1) || { echo "ERROR: git-lfs is not installed."; exit 1; }
command -v "$PYTHON_BIN" >/dev/null 2>&1 || { echo "ERROR: $PYTHON_BIN is not installed."; exit 1; }

pushd "$ROOT_DIR" >/dev/null
if ! git lfs install >/dev/null 2>&1; then
    echo "Git LFS install reported an existing hook. Trying forced update..."
    git lfs update --force
fi
popd >/dev/null
echo "Git LFS is ready."

echo
echo "[1/11] Installing ComfyUI..."
if [ -d "$COMFY_DIR/.git" ]; then
    echo "Existing ComfyUI repo found, pulling latest..."
    git -C "$COMFY_DIR" pull
elif [ -e "$COMFY_DIR" ]; then
    echo "ComfyUI folder exists but is not a git repo."
    echo "Removing it and reinstalling cleanly..."
    rm -rf "$COMFY_DIR"
    git clone https://github.com/comfy-org/ComfyUI "$COMFY_DIR"
else
    git clone https://github.com/comfy-org/ComfyUI "$COMFY_DIR"
fi
rm -f "$COMFY_DIR/.gitignore"

echo
echo "[2/11] Creating Python virtual environment..."
if [ ! -x "$VENV_DIR/bin/python" ]; then
    "$PYTHON_BIN" -m venv "$VENV_DIR"
fi

source "$VENV_DIR/bin/activate"
python -m pip install --upgrade pip wheel "setuptools<82"

echo
echo "[3/11] Installing PyTorch..."
python -m pip install torch torchvision torchaudio --extra-index-url https://download.pytorch.org/whl/cu130

echo
echo "[4/11] Installing ComfyUI requirements..."
python -m pip install -r "$COMFY_DIR/requirements.txt"

echo
echo "[5/11] Installing ComfyUI-Manager..."
if [ -d "$MANAGER_DIR/.git" ]; then
    echo "Existing ComfyUI-Manager repo found, pulling latest..."
    git -C "$MANAGER_DIR" pull
elif [ -e "$MANAGER_DIR" ]; then
    echo "ComfyUI-Manager folder exists but is not a git repo."
    echo "Removing it and reinstalling cleanly..."
    rm -rf "$MANAGER_DIR"
    git clone https://github.com/comfy-org/ComfyUI-Manager "$MANAGER_DIR"
else
    git clone https://github.com/comfy-org/ComfyUI-Manager "$MANAGER_DIR"
fi
rm -f "$MANAGER_DIR/.gitignore"

if [ -f "$MANAGER_DIR/requirements.txt" ]; then
    python -m pip install -r "$MANAGER_DIR/requirements.txt"
fi

echo
echo "[6/11] Installing VNCCS..."
if [ -d "$VNCCS_DIR/.git" ]; then
    echo "Existing VNCCS repo found, pulling latest..."
    git -C "$VNCCS_DIR" pull
elif [ -e "$VNCCS_DIR" ]; then
    echo "VNCCS folder exists but is not a git repo."
    echo "Removing it and reinstalling cleanly..."
    rm -rf "$VNCCS_DIR"
    git clone https://github.com/AHEKOT/ComfyUI_VNCCS "$VNCCS_DIR"
else
    git clone https://github.com/AHEKOT/ComfyUI_VNCCS "$VNCCS_DIR"
fi
rm -f "$VNCCS_DIR/.gitignore"

if [ -f "$VNCCS_DIR/requirements.txt" ]; then
    python -m pip install -r "$VNCCS_DIR/requirements.txt"
fi

python -m pip install timm huggingface_hub requests websocket-client pillow

echo
echo "[7/11] Creating model folders..."
mkdir -p \
  "$MODELS_DIR/checkpoints" \
  "$MODELS_DIR/controlnet" \
  "$MODELS_DIR/loras" \
  "$MODELS_DIR/sams" \
  "$MODELS_DIR/upscale_models" \
  "$MODELS_DIR/ultralytics" \
  "$MODELS_DIR/vae" \
  "$MODELS_DIR/text_encoders" \
  "$MODELS_DIR/diffusion_models"

cat > "$TMP_DIR/download_vnccs_models.py" <<'PY'
from huggingface_hub import snapshot_download
import os, shutil, sys
tmp_dir = os.environ["VNCCS_MODELS_TMP"]
out_dir = os.environ["MODELS_DIR"]
token = os.environ.get("HF_TOKEN") or None
if os.path.exists(tmp_dir):
    shutil.rmtree(tmp_dir)
snapshot_download(repo_id="MIUProject/VNCCS", repo_type="model", local_dir=tmp_dir, local_dir_use_symlinks=False, token=token)
src = os.path.join(tmp_dir, "models")
if not os.path.isdir(src):
    print("ERROR: Expected folder not found:", src)
    sys.exit(1)
for name in os.listdir(src):
    s = os.path.join(src, name)
    d = os.path.join(out_dir, name)
    if os.path.isdir(s):
        if os.path.exists(d):
            shutil.rmtree(d)
        shutil.copytree(s, d)
    else:
        shutil.copy2(s, d)
print("VNCCS models copied successfully.")
PY

cat > "$TMP_DIR/download_illustrious.py" <<'PY'
from huggingface_hub import snapshot_download
import os
out_dir = os.environ["ILLUSTRIOUS_OUT"]
token = os.environ.get("HF_TOKEN") or None
snapshot_download(repo_id="OnomaAIResearch/Illustrious-XL-v1.0", repo_type="model", local_dir=out_dir, local_dir_use_symlinks=False, allow_patterns=["*.safetensors","*.json","*.txt","*.md"], token=token)
print("Illustrious XL downloaded.")
PY

if [ "$DOWNLOAD_FULL_VNCCS_MODELS" = "1" ]; then
    echo
    echo "[8/11] Downloading VNCCS models..."
    export VNCCS_MODELS_TMP="$VNCCS_HF_REPO_DIR"
    export MODELS_DIR
    export HF_TOKEN
    python "$TMP_DIR/download_vnccs_models.py"
else
    echo
    echo "[8/11] Skipping VNCCS model download."
fi

if [ "$DOWNLOAD_ILLUSTRIOUS" = "1" ]; then
    echo
    echo "[9/11] Downloading Illustrious XL..."
    export ILLUSTRIOUS_OUT="$MODELS_DIR/checkpoints"
    export HF_TOKEN
    if ! python "$TMP_DIR/download_illustrious.py"; then
        echo "WARNING: Illustrious XL download failed."
        echo "You may need to accept the model page or set HF_TOKEN."
    fi
else
    echo
    echo "[9/11] Skipping Illustrious XL download."
fi

echo
echo "[10/11] Creating helper scripts..."

cat > "$ROOT_DIR/run_comfyui_api.sh" <<SH
#!/usr/bin/env bash
set -euo pipefail
ROOT_DIR="\$(cd "\$(dirname "\${BASH_SOURCE[0]}")" && pwd)"
source "\$ROOT_DIR/venv/bin/activate"
cd "\$ROOT_DIR/ComfyUI"
python main.py --listen 127.0.0.1 --port $COMFY_PORT
SH
chmod +x "$ROOT_DIR/run_comfyui_api.sh"

cat > "$ROOT_DIR/run_comfyui_api_network.sh" <<SH
#!/usr/bin/env bash
set -euo pipefail
ROOT_DIR="\$(cd "\$(dirname "\${BASH_SOURCE[0]}")" && pwd)"
source "\$ROOT_DIR/venv/bin/activate"
cd "\$ROOT_DIR/ComfyUI"
python main.py --listen 0.0.0.0 --port $COMFY_PORT
SH
chmod +x "$ROOT_DIR/run_comfyui_api_network.sh"

cat > "$ROOT_DIR/install_python_client_deps.sh" <<'SH'
#!/usr/bin/env bash
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$ROOT_DIR/venv/bin/activate"
python -m pip install requests websocket-client pillow
SH
chmod +x "$ROOT_DIR/install_python_client_deps.sh"

cat > "$ROOT_DIR/check_install.sh" <<'SH'
#!/usr/bin/env bash
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMFY_DIR="$ROOT_DIR/ComfyUI"
VNCCS_DIR="$COMFY_DIR/custom_nodes/ComfyUI_VNCCS"
MODELS_DIR="$COMFY_DIR/models"
echo "Checking install..."
[ -f "$COMFY_DIR/main.py" ] || echo "MISSING: ComfyUI main.py"
[ -d "$VNCCS_DIR" ] || echo "MISSING: VNCCS folder"
[ -d "$MODELS_DIR/loras" ] || echo "MISSING: loras"
[ -d "$MODELS_DIR/controlnet" ] || echo "MISSING: controlnet"
[ -d "$MODELS_DIR/checkpoints" ] || echo "MISSING: checkpoints"
[ -d "$MODELS_DIR/models" ] && echo "WARNING: nested models folder exists"
ls -la "$MODELS_DIR"
SH
chmod +x "$ROOT_DIR/check_install.sh"

cat > "$ROOT_DIR/comfy_client_example.py" <<PY
import json, os, uuid
from urllib.parse import urlencode
import requests, websocket

BASE_URL = "http://127.0.0.1:$COMFY_PORT"
CLIENT_ID = str(uuid.uuid4())

def load_workflow(path):
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)

def queue_prompt(prompt):
    r = requests.post(f"{BASE_URL}/prompt", json={"prompt": prompt, "client_id": CLIENT_ID})
    r.raise_for_status()
    return r.json()["prompt_id"]

def wait_for_completion(prompt_id):
    ws = websocket.create_connection(f"ws://127.0.0.1:$COMFY_PORT/ws?clientId={CLIENT_ID}", timeout=300)
    try:
        while True:
            msg = ws.recv()
            if isinstance(msg, bytes):
                continue
            data = json.loads(msg)
            if data.get("type") == "executing":
                d = data.get("data", {})
                if d.get("prompt_id") == prompt_id and d.get("node") is None:
                    return
    finally:
        ws.close()

def get_history(prompt_id):
    r = requests.get(f"{BASE_URL}/history/{prompt_id}")
    r.raise_for_status()
    return r.json()

def download_image(filename, subfolder, folder_type, out_path):
    params = urlencode({"filename": filename, "subfolder": subfolder, "type": folder_type})
    r = requests.get(f"{BASE_URL}/view?{params}")
    r.raise_for_status()
    with open(out_path, "wb") as f:
        f.write(r.content)

def main():
    workflow = load_workflow("workflow_api.json")
    prompt_id = queue_prompt(workflow)
    wait_for_completion(prompt_id)
    history = get_history(prompt_id)
    record = history[prompt_id]
    outputs = record.get("outputs", {})
    os.makedirs("downloaded_outputs", exist_ok=True)
    i = 0
    for _, node_output in outputs.items():
        for image in node_output.get("images", []):
            i += 1
            out_name = os.path.join("downloaded_outputs", f"output_{i}.png")
            download_image(image["filename"], image.get("subfolder", ""), image["type"], out_name)
            print("Saved:", out_name)

if __name__ == "__main__":
    main()
PY


cat > "$ROOT_DIR/.gitignore" <<'GITIGNORE'
*
!setup_everything.bat
!setup_everything.sh
!ComfyUI/
!ComfyUI/**
GITIGNORE

echo "[11/11] Setup complete."
echo
echo "The following files were created:"
echo "  run_comfyui_api.sh"
echo "  run_comfyui_api_network.sh"
echo "  install_python_client_deps.sh"
echo "  check_install.sh"
echo "  comfy_client_example.py"
echo
echo "Next steps:"
echo "1. Run check_install.sh to confirm everything is in the right place."
echo "2. Run run_comfyui_api.sh, then open http://127.0.0.1:8188/"
echo "3. In ComfyUI, drag in all workflow JSON files from ComfyUI/custom_nodes/ComfyUI_VNCCS/workflows and save them."
echo "4. Open Manager, install any missing custom modules, then restart ComfyUI."
echo "5. Download any remaining model files if needed."
echo
read -r -p "Press Enter to exit..."
exit 0
