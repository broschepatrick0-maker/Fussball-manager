#!/usr/bin/env bash
# Kompiliert die Unity-Skripte gegen die DLLs eines echten Unity-Editors (läuft im unityci-Docker-Image, ohne Lizenz).
set -euo pipefail
U=$(dirname "$(find / -type d -name Managed -path '*Editor/Data/Managed' 2>/dev/null | head -1)")
echo "Editor-Daten: $U"
DOTNET=$(find "$U" -type f -name dotnet -path '*NetCoreRuntime*' | head -1)
CSC=$(find "$U" -type f -name csc.dll -path '*Roslyn*' | head -1)
NETSTD=$(find "$U" -type f -name netstandard.dll -path '*ref/2.1.0*' | head -1)
echo "dotnet=$DOTNET csc=$CSC netstandard=$NETSTD"
REFS=()
for f in "$U"/Managed/UnityEngine/*.dll; do case "$f" in *Editor*) ;; *) REFS+=("-r:$f");; esac; done
UIASM=$(find "$U" -name 'UnityEngine.UI.asmdef' -path '*com.unity.ugui*' | grep -v -i editor | head -1)
UIDIR=$(dirname "$UIASM"); echo "uGUI-Quellen: $UIDIR"
DEF="UNITY_6000_0_OR_NEWER;UNITY_2023_1_OR_NEWER;UNITY_2022_3_OR_NEWER;UNITY_2022_2_OR_NEWER;UNITY_2021_3_OR_NEWER;UNITY_2021_2_OR_NEWER;UNITY_2021_1_OR_NEWER;UNITY_2020_3_OR_NEWER;UNITY_2020_1_OR_NEWER;UNITY_2019_4_OR_NEWER;UNITY_2019_1_OR_NEWER;PACKAGE_PHYSICS;PACKAGE_PHYSICS2D;PACKAGE_ANIMATION;PACKAGE_TILEMAP;PACKAGE_UITOOLKIT;ENABLE_LEGACY_INPUT_MANAGER;UNITY_STANDALONE"
find "$UIDIR" -name '*.cs' > /tmp/ui.rsp
"$DOTNET" "$CSC" -nologo -nowarn:1701,1702,0618,0649,0414,0169 -langversion:9 -unsafe -target:library -out:/tmp/UnityEngine.UI.dll -nostdlib -r:"$NETSTD" "${REFS[@]}" -define:"$DEF" @/tmp/ui.rsp > /tmp/ui.log || { grep -m 40 "error" /tmp/ui.log; exit 1; }
echo "uGUI kompiliert"
SRC=$(find "$1/Assets/Scripts" -name '*.cs')
for EXTRA in "ENABLE_LEGACY_INPUT_MANAGER;UNITY_ANDROID" "ENABLE_INPUT_SYSTEM;UNITY_STANDALONE_WIN" "ENABLE_INPUT_SYSTEM;ENABLE_LEGACY_INPUT_MANAGER"; do
  echo "== Spielskripte mit $EXTRA =="
  "$DOTNET" "$CSC" -nologo -nowarn:1701,1702 -langversion:9 -target:library -out:/tmp/Game.dll -nostdlib -r:"$NETSTD" "${REFS[@]}" -r:/tmp/UnityEngine.UI.dll -define:"UNITY_6000_0_OR_NEWER;$EXTRA" $SRC
done
echo "UNITY-KOMPILIERUNG OK"
