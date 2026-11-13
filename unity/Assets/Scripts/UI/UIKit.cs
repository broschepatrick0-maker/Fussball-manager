// Baukasten für die Oberfläche: alles wird per Code erzeugt, damit keine Szene oder Prefabs eingerichtet werden müssen.
using System;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;
using FP.Core;

namespace FP.UI
{
    public static class K
    {
        public static Font F;
        public static readonly Color Bg = Hex("#0f1512"), Card = Hex("#18221d"), Card2 = Hex("#1f2c25"), Line = Hex("#2a3a31"),
            Txt = Hex("#e8efe9"), Mut = Hex("#8fa397"), Acc = Hex("#3fb37f"), AccD = Hex("#2b7d58"), Up = Hex("#3fb37f"), Rel = Hex("#d9a441"), Down = Hex("#d9534f"), Gold = Hex("#e8c547");
        public const int FS = 38, FSs = 32, FSh = 54;
        static Texture2D circle;
        static readonly Dictionary<string, Texture2D> crestCache = new Dictionary<string, Texture2D>();

        public static Color Hex(string h) { Color c; return !string.IsNullOrEmpty(h) && ColorUtility.TryParseHtmlString(h, out c) ? c : new Color(.36f, .42f, .38f); }

        public static void Init()
        {
            if (F != null) return;
            try { F = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf"); } catch (Exception) { }
            if (F == null) try { F = Resources.GetBuiltinResource<Font>("Arial.ttf"); } catch (Exception) { }
            if (F == null) F = Font.CreateDynamicFontFromOSFont("Arial", 32);
        }

        public static RectTransform Rect(string name, Transform parent)
        {
            var go = new GameObject(name, typeof(RectTransform)); go.transform.SetParent(parent, false);
            return (RectTransform)go.transform;
        }
        public static void Fill(RectTransform r) { r.anchorMin = Vector2.zero; r.anchorMax = Vector2.one; r.offsetMin = r.offsetMax = Vector2.zero; }
        public static LayoutElement LE(Component c, float w = -1, float h = -1, float flexW = -1, float flexH = -1)
        {
            var le = c.GetComponent<LayoutElement>(); if (le == null) le = c.gameObject.AddComponent<LayoutElement>();
            if (w >= 0) { le.minWidth = w; le.preferredWidth = w; }
            if (h >= 0) { le.minHeight = h; le.preferredHeight = h; }
            if (flexW >= 0) le.flexibleWidth = flexW;
            if (flexH >= 0) le.flexibleHeight = flexH;
            return le;
        }

        public static RectTransform VBox(Transform p, float spacing = 0, int pad = 0, Color? bg = null, string name = "VBox")
        {
            var r = Rect(name, p); if (bg.HasValue) r.gameObject.AddComponent<Image>().color = bg.Value;
            var v = r.gameObject.AddComponent<VerticalLayoutGroup>();
            v.spacing = spacing; v.padding = new RectOffset(pad, pad, pad, pad);
            v.childControlWidth = true; v.childControlHeight = true; v.childForceExpandWidth = true; v.childForceExpandHeight = false;
            return r;
        }
        public static RectTransform HBox(Transform p, float h, float spacing = 16, int padX = 0, Color? bg = null, string name = "HBox")
        {
            var r = Rect(name, p); if (bg.HasValue) r.gameObject.AddComponent<Image>().color = bg.Value;
            var x = r.gameObject.AddComponent<HorizontalLayoutGroup>();
            x.spacing = spacing; x.padding = new RectOffset(padX, padX, 0, 0); x.childAlignment = TextAnchor.MiddleLeft;
            x.childControlWidth = true; x.childControlHeight = true; x.childForceExpandWidth = false; x.childForceExpandHeight = false;
            if (h > 0) LE(r, -1, h);
            return r;
        }

        public static Text Label(Transform p, string s, int size = FS, Color? c = null, TextAnchor a = TextAnchor.MiddleLeft, FontStyle st = FontStyle.Normal, float w = -1, bool wrap = true)
        {
            var r = Rect("Text", p); var t = r.gameObject.AddComponent<Text>();
            t.font = F; t.text = s; t.fontSize = size; t.color = c ?? Txt; t.alignment = a; t.fontStyle = st; t.raycastTarget = false;
            t.horizontalOverflow = wrap ? HorizontalWrapMode.Wrap : HorizontalWrapMode.Overflow; t.verticalOverflow = VerticalWrapMode.Overflow;
            if (w >= 0) LE(t, w); else LE(t, -1, -1, 1);
            return t;
        }
        // Einzeilig, abgeschnitten (für Tabellen)
        public static Text Cell(Transform p, string s, float w, TextAnchor a = TextAnchor.MiddleLeft, Color? c = null, FontStyle st = FontStyle.Normal, int size = FS)
        {
            var t = Label(p, s, size, c, a, st, w); t.horizontalOverflow = HorizontalWrapMode.Wrap; t.verticalOverflow = VerticalWrapMode.Truncate;
            if (w < 0) { var le = LE(t, -1, -1, 1); le.minWidth = 0; le.preferredWidth = 0; }
            return t;
        }

        public static Button Btn(Transform p, string s, Action on, Color? bg = null, float h = 110, float w = -1, int size = FS, Color? fg = null)
        {
            var r = Rect("Button", p); var img = r.gameObject.AddComponent<Image>(); img.color = bg ?? Card2;
            var b = r.gameObject.AddComponent<Button>(); b.targetGraphic = img;
            var cb = b.colors; cb.highlightedColor = new Color(1, 1, 1, .92f); cb.pressedColor = new Color(.8f, .8f, .8f, 1); b.colors = cb;
            if (on != null) b.onClick.AddListener(() => on());
            var t = Label(r, s, size, fg ?? Txt, TextAnchor.MiddleCenter, FontStyle.Bold); Fill(t.rectTransform);
            LE(b, w, h, w < 0 ? 1 : 0);
            return b;
        }
        // Macht eine ganze Zeile anklickbar
        public static void Click(RectTransform r, Action on)
        {
            var img = r.GetComponent<Image>(); bool hover = img == null;
            if (hover) { img = r.gameObject.AddComponent<Image>(); img.color = Color.white; }
            var b = r.gameObject.AddComponent<Button>(); b.targetGraphic = img; b.onClick.AddListener(() => on());
            if (hover)
            {
                // unsichtbar, beim Überfahren mit der Maus leicht aufgehellt
                var cb = b.colors; cb.normalColor = new Color(1, 1, 1, 0); cb.highlightedColor = new Color(1, 1, 1, .06f); cb.pressedColor = new Color(1, 1, 1, .12f); cb.selectedColor = new Color(1, 1, 1, 0); cb.fadeDuration = .05f; b.colors = cb;
            }
        }
        public static void Gap(Transform p, float h) { LE(Rect("Gap", p), -1, h); }
        public static void Divider(Transform p) { var r = Rect("Line", p); r.gameObject.AddComponent<Image>().color = Line; LE(r, -1, 2); }

        public static RectTransform CardBox(Transform p, int pad = 28, float spacing = 12)
        {
            return VBox(p, spacing, pad, Card, "Card");
        }

        // ---------- Wappen ----------
        static Texture2D Circle()
        {
            if (circle != null) return circle;
            int n = 128; circle = new Texture2D(n, n, TextureFormat.RGBA32, false);
            var px = new Color32[n * n]; float c = (n - 1) / 2f, rad = n / 2f - 1;
            for (int y = 0; y < n; y++) for (int x = 0; x < n; x++)
            {
                float d = Mathf.Sqrt((x - c) * (x - c) + (y - c) * (y - c)); byte a = (byte)(Mathf.Clamp01(rad - d + .5f) * 255);
                px[y * n + x] = new Color32(255, 255, 255, a);
            }
            circle.SetPixels32(px); circle.Apply(); return circle;
        }
        public static Texture2D CrestTex(string key)
        {
            if (string.IsNullOrEmpty(key)) return null;
            Texture2D t; if (crestCache.TryGetValue(key, out t)) return t;
            t = Resources.Load<Texture2D>("Crests/" + key); crestCache[key] = t; return t;
        }
        public static RectTransform Crest(Transform p, Team t, float size)
        {
            var r = Rect("Crest", p); LE(r, size, size); r.sizeDelta = new Vector2(size, size);
            var tex = CrestTex(t.crest);
            if (tex != null) { var ri = r.gameObject.AddComponent<RawImage>(); ri.texture = tex; ri.raycastTarget = false; return r; }
            // Ersatzwappen: Kreis in Vereinsfarbe mit Initialen
            var bgc = r.gameObject.AddComponent<RawImage>(); bgc.texture = Circle(); bgc.color = Hex(t.c1); bgc.raycastTarget = false;
            var c2 = Hex(t.c2); if (Mathf.Abs(c2.grayscale - bgc.color.grayscale) < .2f) c2 = bgc.color.grayscale > .5f ? Color.black : Color.white;
            var lb = Label(r, Initials(t.name), Mathf.RoundToInt(size * .36f), c2, TextAnchor.MiddleCenter, FontStyle.Bold); Fill(lb.rectTransform);
            return r;
        }
        public static string Initials(string n)
        {
            var parts = n.Split(new[] { ' ', '-', '.' }, StringSplitOptions.RemoveEmptyEntries); string s = "";
            foreach (var w in parts) { if (char.IsDigit(w[0]) || w.Length < 2) continue; if (char.IsUpper(w[0])) s += w[0]; if (s.Length >= 3) break; }
            return s.Length > 0 ? s : "FC";
        }
        public static void Clear(Transform t) { for (int i = t.childCount - 1; i >= 0; i--) { var c = t.GetChild(i); c.SetParent(null, false); UnityEngine.Object.Destroy(c.gameObject); } }
    }
}
