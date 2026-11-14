#!/usr/bin/env bash
# setup.sh - set up Cloud Shell for the "From Vibe to Verified" lab in one go.
#
# Run it from the starter folder, after you claimed the event credit in the browser:
#
#   ./scripts/setup.sh           # Gemini 4 Argon, paid by the event credit
#   ./scripts/setup.sh --flash   # free Gemini 3.8 Flash, no credit needed
#   source ~/.bashrc
#
# What it does (each step is the same as a LAB.md section you can also do by hand):
#   1. Checks that gcloud, git and npm are here                     (LAB.md 0.1)
#   2. Sets your git name and e-mail, if they are not set yet       (LAB.md 0.3)
#   3. Installs the current agy with Google's official installer    (LAB.md 0.2)
#   4. Installs the conductor and verified plugins for agy          (LAB.md 0.3)
#   5. Runs npm ci and npm run verify:contract in this folder       (LAB.md 0.3)
#   6. Finds the open billing account of the credit (name has GDP)  (LAB.md 1)
#      --flash: only if one is there; it does not wait for it
#   7. Makes a project vtv-..., links it to the credit and saves
#      "export CLOUDSDK_CORE_PROJECT=..." in ~/.bashrc              (LAB.md 1)
#   8. Enables Cloud Run, Cloud Build and Artifact Registry, and for
#      Argon also Agent Platform plus the AGY_ADC_AUTH line in
#      ~/.bashrc. --flash removes that line instead.                (LAB.md 1, 2.1)
#
# Safe to run again: it skips what is already done, reuses the project saved in ~/.bashrc
# when it is linked to billing, and never adds a ~/.bashrc line twice.
# It talks only to Google (gcloud, the agy installer), GitHub (plugins) and npm.
# It prints no keys or tokens.
#
# Without a terminal prompt, set your git identity first: GIT_NAME="..." GIT_EMAIL="..." ./scripts/setup.sh

set -euo pipefail

MODE=argon
for arg in "$@"; do
  case "$arg" in
    --flash) MODE=flash ;;
    -h | --help)
      sed -n '2,29p' "$0" | sed 's/^# \{0,1\}//'
      exit 0
      ;;
    *)
      echo "Unknown option: $arg (use --flash or --help)" >&2
      exit 2
      ;;
  esac
done

TOTAL=8
STEP=0
STEP_NAME=""
STEP_LAB=""
BASHRC="$HOME/.bashrc"
REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
export PATH="$HOME/.local/bin:$PATH"

step() {
  STEP=$((STEP + 1))
  STEP_NAME="$1"
  STEP_LAB="$2"
  echo
  echo "[$STEP/$TOTAL] $STEP_NAME"
}
info() { echo "      $*"; }

on_error() {
  local code=$?
  echo >&2
  echo "Setup stopped at step [$STEP/$TOTAL] $STEP_NAME (exit code $code, line $1)." >&2
  echo "Fix the message above and run ./scripts/setup.sh again: finished steps are skipped." >&2
  echo "Or do this step by hand: LAB.md section $STEP_LAB (\"Do it by hand\")." >&2
  exit "$code"
}
trap 'on_error $LINENO' ERR

# Run a command again after a short wait when Google says "too many requests" or the
# permission has not landed yet (both are normal for a minute after making a project).
retry() {
  local tries=$1 wait=$2 n=1
  shift 2
  until "$@"; do
    if [ "$n" -ge "$tries" ]; then return 1; fi
    info "Not ready yet, trying again in ${wait}s (try $((n + 1)) of $tries) ..."
    sleep "$wait"
    n=$((n + 1))
    wait=$((wait + 10))
  done
}

# Add a line to ~/.bashrc only if it is not there yet.
add_line() {
  touch "$BASHRC"
  if grep -qxF "$1" "$BASHRC"; then
    info "Already in your .bashrc: $1"
  else
    echo "$1" >>"$BASHRC"
    info "Added to your .bashrc: $1"
  fi
}

echo "From Vibe to Verified: Cloud Shell setup ($([ "$MODE" = argon ] && echo 'Gemini 4 Argon on the event credit' || echo 'free Gemini 3.8 Flash'))"
echo "Starter folder: $REPO_DIR"

# ---------------------------------------------------------------------------------------------
step "Check the tools" "0.1"
for tool in gcloud git npm node curl; do
  command -v "$tool" >/dev/null || { echo "Missing: $tool. Use Cloud Shell (LAB.md 0.1) or Appendix A." >&2; false; }
done
ACCOUNT="$(gcloud config get-value account 2>/dev/null || true)"
if [ -z "$ACCOUNT" ]; then
  echo "gcloud has no account. In Cloud Shell click Authorize when asked; on a laptop run gcloud auth login." >&2
  false
fi
info "gcloud, git, npm and node are here. Node $(node -v)."

# ---------------------------------------------------------------------------------------------
step "Set your git name and e-mail" "0.3"
if [ -n "$(git config --global user.name || true)" ] && [ -n "$(git config --global user.email || true)" ]; then
  info "Already set: $(git config --global user.name)"
else
  name="${GIT_NAME:-}"
  email="${GIT_EMAIL:-}"
  if [ -z "$name" ] || [ -z "$email" ]; then
    if [ ! -t 0 ]; then
      echo "No terminal to ask in. Run again with GIT_NAME=\"Your Name\" GIT_EMAIL=\"you@example.com\"." >&2
      false
    fi
    info "Conductor commits each task, so git needs a name. Any name and e-mail you like."
    while [ -z "$name" ]; do read -r -p "      Your name: " name; done
    while [ -z "$email" ]; do read -r -p "      Your e-mail: " email; done
  fi
  git config --global user.name "$name"
  git config --global user.email "$email"
  info "Set: $name"
fi

# ---------------------------------------------------------------------------------------------
step "Install agy (Google's official installer)" "0.2"
if [ -x "$HOME/.local/bin/agy" ]; then
  info "Already installed in ~/.local/bin (it updates itself)."
else
  info "The installer may print 'ERROR: logging before google.Init' and a PATH warning: both are harmless."
  curl -fsSL https://antigravity.google/cli/install.sh | bash
fi
info "agy: $(agy --version 2>/dev/null | head -n 1)"

# ---------------------------------------------------------------------------------------------
step "Install the conductor and verified plugins" "0.3"
plugins="$(agy plugin list 2>/dev/null || true)"
if grep -qw conductor <<<"$plugins"; then
  info "conductor: already installed."
else
  agy plugin install https://github.com/gemini-cli-extensions/conductor
fi
if grep -qw verified <<<"$plugins"; then
  info "verified: already installed."
else
  agy plugin install https://github.com/opsta/antigravity-verified
fi
plugins="$(agy plugin list 2>/dev/null || true)"
if ! grep -qw conductor <<<"$plugins" || ! grep -qw verified <<<"$plugins"; then
  echo "agy plugin list does not show both conductor and verified." >&2
  false
fi
info "conductor and verified are installed."

# ---------------------------------------------------------------------------------------------
step "Install the starter's packages and check it is healthy (npm ci, verify:contract)" "0.3"
cd "$REPO_DIR"
info "npm ci should end with 'found 0 vulnerabilities'. Never run npm audit fix."
npm ci --no-fund
npm run verify:contract
info "verify:contract passed."

# ---------------------------------------------------------------------------------------------
step "Find the credit's billing account" "1"
find_billing() {
  BILLING_LINE="$(gcloud billing accounts list --filter="open=true AND displayName~GDP" \
    --format="value(name.basename(),displayName)" | head -n 1)"
}
BILLING_LINE=""
retry 3 15 find_billing
if [ -z "$BILLING_LINE" ] && [ "$MODE" = argon ]; then
  info "No open GDP billing account yet. The credit takes 3-5 minutes after you click Claim Credit."
  for _ in $(seq 1 18); do
    sleep 20
    retry 3 15 find_billing
    if [ -n "$BILLING_LINE" ]; then break; fi
    info "Still waiting for the credit ..."
  done
fi
if [ -z "$BILLING_LINE" ]; then
  if [ "$MODE" = flash ]; then
    info "No credit found. That is fine for free Flash; you can deploy later once you have one (LAB.md 1, 5)."
  else
    echo "No open billing account named GDP after 6 minutes." >&2
    echo "Check the claim page said it worked and that Cloud Shell uses the same @gmail.com ($ACCOUNT)." >&2
    echo "Then run ./scripts/setup.sh again, or use free Flash: ./scripts/setup.sh --flash" >&2
    false
  fi
fi
BILLING_ACCOUNT="${BILLING_LINE%%$'\t'*}"
BILLING_NAME="${BILLING_LINE#*$'\t'}"
if [ -n "$BILLING_LINE" ]; then info "Found: $BILLING_NAME"; fi

# ---------------------------------------------------------------------------------------------
step "Make your project and link it to the credit" "1"
PROJECT_ID=""
saved="$(grep -E '^export CLOUDSDK_CORE_PROJECT=' "$BASHRC" 2>/dev/null | tail -n 1 | cut -d= -f2- || true)"
if [ -n "$saved" ]; then
  billing_enabled="$(gcloud billing projects describe "$saved" --format='value(billingEnabled)' 2>/dev/null || true)"
  if [ "$billing_enabled" = "True" ]; then
    PROJECT_ID="$saved"
    info "Reusing your project from ~/.bashrc: $PROJECT_ID (billing linked)."
  elif [ -n "$BILLING_ACCOUNT" ] && gcloud projects describe "$saved" >/dev/null 2>&1; then
    PROJECT_ID="$saved"
    info "Reusing your project from ~/.bashrc: $PROJECT_ID; linking it to the credit."
    retry 4 15 gcloud billing projects link "$PROJECT_ID" --billing-account="$BILLING_ACCOUNT"
  else
    info "The project in ~/.bashrc ($saved) cannot be used; making a new one."
    sed -i '/^export CLOUDSDK_CORE_PROJECT=/d;/AGY_ADC_AUTH/d' "$BASHRC"
  fi
fi
if [ -z "$PROJECT_ID" ]; then
  if [ -z "$BILLING_ACCOUNT" ]; then
    info "No credit, so no project yet (free Flash does not need one)."
  else
    for _ in 1 2 3; do
      PROJECT_ID="vtv-$(date +%s)-$RANDOM"
      if gcloud projects create "$PROJECT_ID"; then break; fi
      PROJECT_ID=""
      sleep 5
    done
    [ -n "$PROJECT_ID" ] || { echo "Could not make a project (too many projects? reuse one of yours)." >&2; false; }
    retry 4 15 gcloud billing projects link "$PROJECT_ID" --billing-account="$BILLING_ACCOUNT"
  fi
fi
if [ -n "$PROJECT_ID" ]; then
  add_line "export CLOUDSDK_CORE_PROJECT=$PROJECT_ID"
  export CLOUDSDK_CORE_PROJECT="$PROJECT_ID"
fi

# ---------------------------------------------------------------------------------------------
step "Enable the services and point agy at the model" "1 and 2.1"
# shellcheck disable=SC2016 # the variable must expand when .bashrc runs, not now
AGY_LINE='export AGY_ADC_AUTH=true GOOGLE_CLOUD_QUOTA_PROJECT=$CLOUDSDK_CORE_PROJECT'
if [ -n "$PROJECT_ID" ]; then
  services=(run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com)
  if [ "$MODE" = argon ]; then services+=(aiplatform.googleapis.com); fi
  info "Enabling: ${services[*]} (a new project can need a minute or two) ..."
  retry 6 15 gcloud services enable "${services[@]}" --project "$PROJECT_ID"
  info "Services are on."
fi
if [ "$MODE" = argon ]; then
  # Must come after the CLOUDSDK_CORE_PROJECT line, so drop it and add it again at the end.
  sed -i '/AGY_ADC_AUTH/d' "$BASHRC"
  echo "$AGY_LINE" >>"$BASHRC"
  info "Your .bashrc now makes agy use Gemini through your project (Agent Platform), paid by the credit."
else
  if grep -q AGY_ADC_AUTH "$BASHRC" 2>/dev/null; then
    sed -i '/AGY_ADC_AUTH/d' "$BASHRC"
    info "Removed the AGY_ADC_AUTH line from ~/.bashrc. Open a NEW Cloud Shell tab (+) before agy."
  fi
  info "agy will ask 'Select login method': choose 1. Google OAuth (LAB.md 2.1, free Flash box)."
fi

# ---------------------------------------------------------------------------------------------
trap - ERR
echo
echo "Done. Summary"
echo "  Project:          ${PROJECT_ID:-none (free Flash without credit)}"
echo "  Billing account:  ${BILLING_NAME:-none}"
if [ "$MODE" = argon ]; then
  echo "  Model path:       Gemini 4 Argon through Agent Platform (event credit)"
else
  echo "  Model path:       free Gemini 3.8 Flash (Google sign-in)"
fi
echo "  git name:         $(git config --global user.name)"
echo
echo "Next:"
echo "  source ~/.bashrc"
echo "  agy                 (LAB.md 2.1: choose Gemini 4 Argon or Gemini 3.8 Flash with /model)"
