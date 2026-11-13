// Startet das Spiel in jeder Szene von selbst – es muss nichts in Unity eingerichtet werden.
using System;
using UnityEngine;
using UnityEngine.EventSystems;

namespace FP.UI
{
    public static class Boot
    {
        static bool started;

        [RuntimeInitializeOnLoadMethod(RuntimeInitializeLoadType.AfterSceneLoad)]
        static void Go()
        {
            if (started) return; started = true;
            Application.targetFrameRate = 60;
#if UNITY_ANDROID || UNITY_IOS
            Screen.orientation = ScreenOrientation.Portrait;
#endif
            if (Camera.main == null)
            {
                var cam = new GameObject("Main Camera").AddComponent<Camera>();
                cam.tag = "MainCamera"; cam.clearFlags = CameraClearFlags.SolidColor; cam.backgroundColor = K.Bg; cam.orthographic = true;
            }
            if (EventSystem.current == null)
            {
                var es = new GameObject("EventSystem", typeof(EventSystem));
                Type mod = null;
#if ENABLE_INPUT_SYSTEM
                mod = Type.GetType("UnityEngine.InputSystem.UI.InputSystemUIInputModule, Unity.InputSystem");
#endif
                if (mod != null) es.AddComponent(mod); else es.AddComponent<StandaloneInputModule>();
                UnityEngine.Object.DontDestroyOnLoad(es);
            }
            var go = new GameObject("Fussball-Pyramide");
            UnityEngine.Object.DontDestroyOnLoad(go);
            go.AddComponent<App>();
        }
    }
}
