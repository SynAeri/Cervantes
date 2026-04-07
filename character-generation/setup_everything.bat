@echo off
setlocal EnableExtensions EnableDelayedExpansion
title ComfyUI + VNCCS Setup

REM =========================================================
REM CONFIG
REM =========================================================
set "ROOT_DIR=%~dp0"
if "%ROOT_DIR:~-1%"=="\" set "ROOT_DIR=%ROOT_DIR:~0,-1%"

set "COMFY_DIR=%ROOT_DIR%\ComfyUI"
set "VENV_DIR=%ROOT_DIR%\venv"
set "CUSTOM_NODES_DIR=%COMFY_DIR%\custom_nodes"
set "VNCCS_DIR=%CUSTOM_NODES_DIR%\ComfyUI_VNCCS"
set "MANAGER_DIR=%CUSTOM_NODES_DIR%\ComfyUI-Manager"
set "MODELS_DIR=%COMFY_DIR%\models"
set "TMP_DIR=%ROOT_DIR%\tmp"
set "VNCCS_HF_REPO_DIR=%ROOT_DIR%\vnccs_hf_repo"
set "COMFY_PORT=8188"
set "PYTHON_VERSION=3.12"

set "DOWNLOAD_FULL_VNCCS_MODELS=1"
set "DOWNLOAD_ILLUSTRIOUS=1"

REM Optional Hugging Face token for gated models
set "HF_TOKEN="

REM =========================================================
REM PREP
REM =========================================================
if not exist "%TMP_DIR%" mkdir "%TMP_DIR%"

echo.
echo ========================================================
echo Full ComfyUI + VNCCS setup starting
echo ========================================================
echo Root folder: %ROOT_DIR%
echo ComfyUI dir: %COMFY_DIR%
echo Venv dir   : %VENV_DIR%
echo.

REM =========================================================
REM REQUIREMENTS: winget
REM =========================================================
where winget >nul 2>nul
if errorlevel 1 (
    echo ERROR: winget is not available.
    echo Install App Installer from Microsoft Store, then rerun this script.
    pause
    exit /b 1
)

REM =========================================================
REM INSTALL GIT
REM =========================================================
where git >nul 2>nul
if errorlevel 1 (
    echo Installing Git...
    winget install --id Git.Git -e --source winget --accept-package-agreements --accept-source-agreements
    if errorlevel 1 (
        echo ERROR: Failed to install Git.
        pause
        exit /b 1
    )
) else (
    echo Git already installed.
)

REM =========================================================
REM INSTALL GIT LFS
REM =========================================================
git lfs version >nul 2>nul
if errorlevel 1 (
    echo Installing Git LFS...
    winget install --id GitHub.GitLFS -e --source winget --accept-package-agreements --accept-source-agreements
    if errorlevel 1 (
        echo ERROR: Failed to install Git LFS.
        pause
        exit /b 1
    )
) else (
    echo Git LFS already installed.
)

REM =========================================================
REM INSTALL PYTHON
REM =========================================================
where py >nul 2>nul
if errorlevel 1 (
    echo Installing Python %PYTHON_VERSION%...
    winget install --id Python.Python.%PYTHON_VERSION% -e --source winget --accept-package-agreements --accept-source-agreements
    if errorlevel 1 (
        echo ERROR: Failed to install Python.
        pause
        exit /b 1
    )
) else (
    echo Python launcher already installed.
)

REM =========================================================
REM REFRESH PATH
REM =========================================================
set "PATH=%PATH%;%ProgramFiles%\Git\cmd;%LocalAppData%\Programs\Python\Python312;%LocalAppData%\Programs\Python\Python312\Scripts"

where git >nul 2>nul
if errorlevel 1 (
    echo ERROR: Git is still not available in PATH.
    echo Close this window and rerun the script.
    pause
    exit /b 1
)

where py >nul 2>nul
if errorlevel 1 (
    echo ERROR: Python is still not available in PATH.
    echo Close this window and rerun the script.
    pause
    exit /b 1
)

pushd "%ROOT_DIR%"
git lfs install >nul 2>nul
if errorlevel 1 (
    echo Git LFS install reported an existing hook. Trying forced update...
    git lfs update --force
    if errorlevel 1 (
        echo ERROR: Failed to initialise Git LFS in this repository.
        popd
        pause
        exit /b 1
    )
)
popd
echo Git LFS is ready.

REM =========================================================
REM CLONE OR FIX COMFYUI
REM =========================================================
echo.
echo [1/11] Installing ComfyUI...
if exist "%COMFY_DIR%\.git" (
    echo Existing ComfyUI repo found, pulling latest...
    pushd "%COMFY_DIR%"
    git pull
    if errorlevel 1 (
        echo ERROR: Failed to update ComfyUI.
        popd
        pause
        exit /b 1
    )
    popd
) else if exist "%COMFY_DIR%" (
    echo ComfyUI folder exists but is not a git repo.
    echo Removing it and reinstalling cleanly...
    rmdir /s /q "%COMFY_DIR%"
    git clone https://github.com/comfy-org/ComfyUI "%COMFY_DIR%"
    if errorlevel 1 (
        echo ERROR: Failed to clone ComfyUI.
        pause
        exit /b 1
    )
)
if exist "%COMFY_DIR%\.gitignore" del /f /q "%COMFY_DIR%\.gitignore" >nul 2>nul else (
    git clone https://github.com/comfy-org/ComfyUI "%COMFY_DIR%"
    if errorlevel 1 (
        echo ERROR: Failed to clone ComfyUI.
        pause
        exit /b 1
    )
)
if exist "%COMFY_DIR%\.gitignore" del /f /q "%COMFY_DIR%\.gitignore" >nul 2>nul

REM =========================================================
REM CREATE VENV
REM =========================================================
echo.
echo [2/11] Creating Python virtual environment...
if not exist "%VENV_DIR%\Scripts\python.exe" (
    py -%PYTHON_VERSION% -m venv "%VENV_DIR%"
    if errorlevel 1 (
        echo ERROR: Failed to create virtual environment.
        pause
        exit /b 1
    )
)

call "%VENV_DIR%\Scripts\activate.bat"
if errorlevel 1 (
    echo ERROR: Failed to activate virtual environment.
    pause
    exit /b 1
)

python -m pip install --upgrade pip wheel "setuptools<82"
if errorlevel 1 (
    echo ERROR: Failed to install base Python tooling.
    pause
    exit /b 1
)

REM =========================================================
REM INSTALL PYTORCH
REM =========================================================
echo.
echo [3/11] Installing PyTorch...
python -m pip install torch torchvision torchaudio --extra-index-url https://download.pytorch.org/whl/cu130
if errorlevel 1 (
    echo ERROR: Failed to install PyTorch.
    pause
    exit /b 1
)

REM =========================================================
REM INSTALL COMFYUI REQUIREMENTS
REM =========================================================
echo.
echo [4/11] Installing ComfyUI requirements...
python -m pip install -r "%COMFY_DIR%\requirements.txt"
if errorlevel 1 (
    echo ERROR: Failed to install ComfyUI requirements.
    pause
    exit /b 1
)

REM =========================================================
REM INSTALL COMFYUI-MANAGER
REM =========================================================
echo.
echo [5/11] Installing ComfyUI-Manager...
if exist "%MANAGER_DIR%\.git" (
    echo Existing ComfyUI-Manager repo found, pulling latest...
    pushd "%MANAGER_DIR%"
    git pull
    if errorlevel 1 (
        echo ERROR: Failed to update ComfyUI-Manager.
        popd
        pause
        exit /b 1
    )
    popd
) else if exist "%MANAGER_DIR%" (
    echo ComfyUI-Manager folder exists but is not a git repo.
    echo Removing it and reinstalling cleanly...
    rmdir /s /q "%MANAGER_DIR%"
    git clone https://github.com/comfy-org/ComfyUI-Manager "%MANAGER_DIR%"
    if errorlevel 1 (
        echo ERROR: Failed to clone ComfyUI-Manager.
        pause
        exit /b 1
    )
)
if exist "%MANAGER_DIR%\.gitignore" del /f /q "%MANAGER_DIR%\.gitignore" >nul 2>nul else (
    git clone https://github.com/comfy-org/ComfyUI-Manager "%MANAGER_DIR%"
    if errorlevel 1 (
        echo ERROR: Failed to clone ComfyUI-Manager.
        pause
        exit /b 1
    )
)
if exist "%MANAGER_DIR%\.gitignore" del /f /q "%MANAGER_DIR%\.gitignore" >nul 2>nul

if exist "%MANAGER_DIR%\requirements.txt" (
    python -m pip install -r "%MANAGER_DIR%\requirements.txt"
    if errorlevel 1 (
        echo ERROR: Failed to install ComfyUI-Manager requirements.
        pause
        exit /b 1
    )
)

REM =========================================================
REM INSTALL VNCCS
REM =========================================================
echo.
echo [6/11] Installing VNCCS...
if exist "%VNCCS_DIR%\.git" (
    echo Existing VNCCS repo found, pulling latest...
    pushd "%VNCCS_DIR%"
    git pull
    if errorlevel 1 (
        echo ERROR: Failed to update VNCCS.
        popd
        pause
        exit /b 1
    )
    popd
) else if exist "%VNCCS_DIR%" (
    echo VNCCS folder exists but is not a git repo.
    echo Removing it and reinstalling cleanly...
    rmdir /s /q "%VNCCS_DIR%"
    git clone https://github.com/AHEKOT/ComfyUI_VNCCS "%VNCCS_DIR%"
    if errorlevel 1 (
        echo ERROR: Failed to clone VNCCS.
        pause
        exit /b 1
    )
)
if exist "%VNCCS_DIR%\.gitignore" del /f /q "%VNCCS_DIR%\.gitignore" >nul 2>nul else (
    git clone https://github.com/AHEKOT/ComfyUI_VNCCS "%VNCCS_DIR%"
    if errorlevel 1 (
        echo ERROR: Failed to clone VNCCS.
        pause
        exit /b 1
    )
)
if exist "%VNCCS_DIR%\.gitignore" del /f /q "%VNCCS_DIR%\.gitignore" >nul 2>nul

if exist "%VNCCS_DIR%\requirements.txt" (
    python -m pip install -r "%VNCCS_DIR%\requirements.txt"
    if errorlevel 1 (
        echo ERROR: Failed to install VNCCS requirements.
        pause
        exit /b 1
    )
)

python -m pip install timm huggingface_hub requests websocket-client pillow
if errorlevel 1 (
    echo ERROR: Failed to install extra Python packages.
    pause
    exit /b 1
)

REM =========================================================
REM MODEL FOLDERS
REM =========================================================
echo.
echo [7/11] Creating model folders...
mkdir "%MODELS_DIR%" 2>nul
mkdir "%MODELS_DIR%\checkpoints" 2>nul
mkdir "%MODELS_DIR%\controlnet" 2>nul
mkdir "%MODELS_DIR%\loras" 2>nul
mkdir "%MODELS_DIR%\sams" 2>nul
mkdir "%MODELS_DIR%\upscale_models" 2>nul
mkdir "%MODELS_DIR%\ultralytics" 2>nul
mkdir "%MODELS_DIR%\vae" 2>nul
mkdir "%MODELS_DIR%\text_encoders" 2>nul
mkdir "%MODELS_DIR%\diffusion_models" 2>nul

REM =========================================================
REM WRITE PYTHON HELPERS
REM =========================================================
> "%TMP_DIR%\download_vnccs_models.py" echo from huggingface_hub import snapshot_download
>>"%TMP_DIR%\download_vnccs_models.py" echo import os, shutil, sys
>>"%TMP_DIR%\download_vnccs_models.py" echo tmp_dir = os.environ["VNCCS_MODELS_TMP"]
>>"%TMP_DIR%\download_vnccs_models.py" echo out_dir = os.environ["MODELS_DIR"]
>>"%TMP_DIR%\download_vnccs_models.py" echo token = os.environ.get("HF_TOKEN") or None
>>"%TMP_DIR%\download_vnccs_models.py" echo if os.path.exists(tmp_dir):
>>"%TMP_DIR%\download_vnccs_models.py" echo^    shutil.rmtree(tmp_dir)
>>"%TMP_DIR%\download_vnccs_models.py" echo snapshot_download(repo_id="MIUProject/VNCCS", repo_type="model", local_dir=tmp_dir, local_dir_use_symlinks=False, token=token)
>>"%TMP_DIR%\download_vnccs_models.py" echo src = os.path.join(tmp_dir, "models")
>>"%TMP_DIR%\download_vnccs_models.py" echo if not os.path.isdir(src):
>>"%TMP_DIR%\download_vnccs_models.py" echo^    print("ERROR: Expected folder not found:", src)
>>"%TMP_DIR%\download_vnccs_models.py" echo^    sys.exit(1)
>>"%TMP_DIR%\download_vnccs_models.py" echo for name in os.listdir(src):
>>"%TMP_DIR%\download_vnccs_models.py" echo^    s = os.path.join(src, name)
>>"%TMP_DIR%\download_vnccs_models.py" echo^    d = os.path.join(out_dir, name)
>>"%TMP_DIR%\download_vnccs_models.py" echo^    if os.path.isdir(s):
>>"%TMP_DIR%\download_vnccs_models.py" echo^        if os.path.exists(d):
>>"%TMP_DIR%\download_vnccs_models.py" echo^            shutil.rmtree(d)
>>"%TMP_DIR%\download_vnccs_models.py" echo^        shutil.copytree(s, d)
>>"%TMP_DIR%\download_vnccs_models.py" echo^    else:
>>"%TMP_DIR%\download_vnccs_models.py" echo^        shutil.copy2(s, d)
>>"%TMP_DIR%\download_vnccs_models.py" echo print("VNCCS models copied successfully.")

> "%TMP_DIR%\download_illustrious.py" echo from huggingface_hub import snapshot_download
>>"%TMP_DIR%\download_illustrious.py" echo import os
>>"%TMP_DIR%\download_illustrious.py" echo out_dir = os.environ["ILLUSTRIOUS_OUT"]
>>"%TMP_DIR%\download_illustrious.py" echo token = os.environ.get("HF_TOKEN") or None
>>"%TMP_DIR%\download_illustrious.py" echo snapshot_download(repo_id="OnomaAIResearch/Illustrious-XL-v1.0", repo_type="model", local_dir=out_dir, local_dir_use_symlinks=False, allow_patterns=["*.safetensors","*.json","*.txt","*.md"], token=token)
>>"%TMP_DIR%\download_illustrious.py" echo print("Illustrious XL downloaded.")

REM =========================================================
REM DOWNLOAD VNCCS MODELS
REM =========================================================
if "%DOWNLOAD_FULL_VNCCS_MODELS%"=="1" (
    echo.
    echo [8/11] Downloading VNCCS models...
    set "VNCCS_MODELS_TMP=%VNCCS_HF_REPO_DIR%"
    python "%TMP_DIR%\download_vnccs_models.py"
    if errorlevel 1 (
        echo ERROR: Failed to download or copy VNCCS models.
        pause
        exit /b 1
    )
) else (
    echo.
    echo [8/11] Skipping VNCCS model download.
)

REM =========================================================
REM DOWNLOAD ILLUSTRIOUS
REM =========================================================
if "%DOWNLOAD_ILLUSTRIOUS%"=="1" (
    echo.
    echo [9/11] Downloading Illustrious XL...
    set "ILLUSTRIOUS_OUT=%MODELS_DIR%\checkpoints"
    python "%TMP_DIR%\download_illustrious.py"
    if errorlevel 1 (
        echo WARNING: Illustrious XL download failed.
        echo You may need to accept the model page or set HF_TOKEN.
    )
) else (
    echo.
    echo [9/11] Skipping Illustrious XL download.
)

REM =========================================================
REM HELPER SCRIPTS
REM =========================================================
echo.
echo [10/11] Creating helper scripts...

> "%ROOT_DIR%\run_comfyui_api.bat" echo @echo off
>>"%ROOT_DIR%\run_comfyui_api.bat" echo call "%VENV_DIR%\Scripts\activate.bat"
>>"%ROOT_DIR%\run_comfyui_api.bat" echo cd /d "%COMFY_DIR%"
>>"%ROOT_DIR%\run_comfyui_api.bat" echo python main.py --listen 127.0.0.1 --port %COMFY_PORT%

> "%ROOT_DIR%\run_comfyui_api_network.bat" echo @echo off
>>"%ROOT_DIR%\run_comfyui_api_network.bat" echo call "%VENV_DIR%\Scripts\activate.bat"
>>"%ROOT_DIR%\run_comfyui_api_network.bat" echo cd /d "%COMFY_DIR%"
>>"%ROOT_DIR%\run_comfyui_api_network.bat" echo python main.py --listen 0.0.0.0 --port %COMFY_PORT%

> "%ROOT_DIR%\install_python_client_deps.bat" echo @echo off
>>"%ROOT_DIR%\install_python_client_deps.bat" echo call "%VENV_DIR%\Scripts\activate.bat"
>>"%ROOT_DIR%\install_python_client_deps.bat" echo python -m pip install requests websocket-client pillow

> "%ROOT_DIR%\check_install.bat" echo @echo off
>>"%ROOT_DIR%\check_install.bat" echo echo Checking install...
>>"%ROOT_DIR%\check_install.bat" echo if not exist "%COMFY_DIR%\main.py" echo MISSING: ComfyUI main.py
>>"%ROOT_DIR%\check_install.bat" echo if not exist "%VNCCS_DIR%" echo MISSING: VNCCS folder
>>"%ROOT_DIR%\check_install.bat" echo if not exist "%MODELS_DIR%\loras" echo MISSING: loras
>>"%ROOT_DIR%\check_install.bat" echo if not exist "%MODELS_DIR%\controlnet" echo MISSING: controlnet
>>"%ROOT_DIR%\check_install.bat" echo if not exist "%MODELS_DIR%\checkpoints" echo MISSING: checkpoints
>>"%ROOT_DIR%\check_install.bat" echo if exist "%MODELS_DIR%\models" echo WARNING: nested models folder exists
>>"%ROOT_DIR%\check_install.bat" echo dir "%MODELS_DIR%"
>>"%ROOT_DIR%\check_install.bat" echo pause

REM =========================================================
REM SIMPLE PYTHON CLIENT
REM =========================================================
> "%ROOT_DIR%\comfy_client_example.py" echo import json, os, uuid
>>"%ROOT_DIR%\comfy_client_example.py" echo from urllib.parse import urlencode
>>"%ROOT_DIR%\comfy_client_example.py" echo import requests, websocket
>>"%ROOT_DIR%\comfy_client_example.py" echo BASE_URL = "http://127.0.0.1:%COMFY_PORT%"
>>"%ROOT_DIR%\comfy_client_example.py" echo CLIENT_ID = str(uuid.uuid4())
>>"%ROOT_DIR%\comfy_client_example.py" echo def load_workflow(path):
>>"%ROOT_DIR%\comfy_client_example.py" echo^    with open(path, "r", encoding="utf-8") as f:
>>"%ROOT_DIR%\comfy_client_example.py" echo^        return json.load(f)
>>"%ROOT_DIR%\comfy_client_example.py" echo def queue_prompt(prompt):
>>"%ROOT_DIR%\comfy_client_example.py" echo^    r = requests.post(f"{BASE_URL}/prompt", json={"prompt": prompt, "client_id": CLIENT_ID})
>>"%ROOT_DIR%\comfy_client_example.py" echo^    r.raise_for_status()
>>"%ROOT_DIR%\comfy_client_example.py" echo^    return r.json()["prompt_id"]
>>"%ROOT_DIR%\comfy_client_example.py" echo def wait_for_completion(prompt_id):
>>"%ROOT_DIR%\comfy_client_example.py" echo^    ws = websocket.create_connection(f"ws://127.0.0.1:%COMFY_PORT%/ws?clientId={CLIENT_ID}", timeout=300)
>>"%ROOT_DIR%\comfy_client_example.py" echo^    try:
>>"%ROOT_DIR%\comfy_client_example.py" echo^        while True:
>>"%ROOT_DIR%\comfy_client_example.py" echo^            msg = ws.recv()
>>"%ROOT_DIR%\comfy_client_example.py" echo^            if isinstance(msg, bytes):
>>"%ROOT_DIR%\comfy_client_example.py" echo^                continue
>>"%ROOT_DIR%\comfy_client_example.py" echo^            data = json.loads(msg)
>>"%ROOT_DIR%\comfy_client_example.py" echo^            if data.get("type") == "executing":
>>"%ROOT_DIR%\comfy_client_example.py" echo^                d = data.get("data", {})
>>"%ROOT_DIR%\comfy_client_example.py" echo^                if d.get("prompt_id") == prompt_id and d.get("node") is None:
>>"%ROOT_DIR%\comfy_client_example.py" echo^                    return
>>"%ROOT_DIR%\comfy_client_example.py" echo^    finally:
>>"%ROOT_DIR%\comfy_client_example.py" echo^        ws.close()
>>"%ROOT_DIR%\comfy_client_example.py" echo def get_history(prompt_id):
>>"%ROOT_DIR%\comfy_client_example.py" echo^    r = requests.get(f"{BASE_URL}/history/{prompt_id}")
>>"%ROOT_DIR%\comfy_client_example.py" echo^    r.raise_for_status()
>>"%ROOT_DIR%\comfy_client_example.py" echo^    return r.json()
>>"%ROOT_DIR%\comfy_client_example.py" echo def download_image(filename, subfolder, folder_type, out_path):
>>"%ROOT_DIR%\comfy_client_example.py" echo^    params = urlencode({"filename": filename, "subfolder": subfolder, "type": folder_type})
>>"%ROOT_DIR%\comfy_client_example.py" echo^    r = requests.get(f"{BASE_URL}/view?{params}")
>>"%ROOT_DIR%\comfy_client_example.py" echo^    r.raise_for_status()
>>"%ROOT_DIR%\comfy_client_example.py" echo^    with open(out_path, "wb") as f:
>>"%ROOT_DIR%\comfy_client_example.py" echo^        f.write(r.content)
>>"%ROOT_DIR%\comfy_client_example.py" echo def main():
>>"%ROOT_DIR%\comfy_client_example.py" echo^    workflow = load_workflow("workflow_api.json")
>>"%ROOT_DIR%\comfy_client_example.py" echo^    prompt_id = queue_prompt(workflow)
>>"%ROOT_DIR%\comfy_client_example.py" echo^    wait_for_completion(prompt_id)
>>"%ROOT_DIR%\comfy_client_example.py" echo^    history = get_history(prompt_id)
>>"%ROOT_DIR%\comfy_client_example.py" echo^    record = history[prompt_id]
>>"%ROOT_DIR%\comfy_client_example.py" echo^    outputs = record.get("outputs", {})
>>"%ROOT_DIR%\comfy_client_example.py" echo^    os.makedirs("downloaded_outputs", exist_ok=True)
>>"%ROOT_DIR%\comfy_client_example.py" echo^    i = 0
>>"%ROOT_DIR%\comfy_client_example.py" echo^    for _, node_output in outputs.items():
>>"%ROOT_DIR%\comfy_client_example.py" echo^        for image in node_output.get("images", []):
>>"%ROOT_DIR%\comfy_client_example.py" echo^            i += 1
>>"%ROOT_DIR%\comfy_client_example.py" echo^            out_name = os.path.join("downloaded_outputs", f"output_{i}.png")
>>"%ROOT_DIR%\comfy_client_example.py" echo^            download_image(image["filename"], image.get("subfolder", ""), image["type"], out_name)
>>"%ROOT_DIR%\comfy_client_example.py" echo^            print("Saved:", out_name)
>>"%ROOT_DIR%\comfy_client_example.py" echo if __name__ == "__main__":
>>"%ROOT_DIR%\comfy_client_example.py" echo^    main()


> "%ROOT_DIR%\.gitignore" echo *
>>"%ROOT_DIR%\.gitignore" echo !setup_everything.bat
>>"%ROOT_DIR%\.gitignore" echo !setup_everything.sh
>>"%ROOT_DIR%\.gitignore" echo !ComfyUI/
>>"%ROOT_DIR%\.gitignore" echo !ComfyUI/**

echo [11/11] Setup complete.
echo.
echo The following files were created:
echo   run_comfyui_api.bat
echo   run_comfyui_api_network.bat
echo   install_python_client_deps.bat
echo   check_install.bat
echo   comfy_client_example.py
echo.
echo Next steps:
echo 1. Run check_install.bat to confirm everything is in the right place.
echo 2. Run run_comfyui_api.bat, then open http://127.0.0.1:8188/
echo 3. In ComfyUI, drag in all workflow JSON files from ComfyUI\custom_nodes\ComfyUI_VNCCS\workflows and save them.
echo 4. Open Manager, install any missing custom modules, then restart ComfyUI.
echo 5. Download any remaining model files if needed.
echo.
pause
exit /b 0
