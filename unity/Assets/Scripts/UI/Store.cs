// Laden der Startdaten aus Resources/Data und Speichern in drei Spielständen (gzip-JSON im persistentDataPath).
using System;
using System.IO;
using System.IO.Compression;
using System.Text;
using UnityEngine;
using FP.Core;

namespace FP.UI
{
    [Serializable] public class SlotMeta { public string club; public string league; public int season; public string mode; public string coach; public string saved; }

    public static class Store
    {
        static NamesDto names;
        public const int Slots = 3;
        public static int Slot = 1;
        static string Dir { get { return Application.persistentDataPath; } }
        public static string PathOf(int s) { return System.IO.Path.Combine(Dir, "spielstand" + s + ".json.gz"); }
        static string MetaOf(int s) { return System.IO.Path.Combine(Dir, "spielstand" + s + ".meta.json"); }

        public static WorldDto LoadWorld()
        {
            var ta = Resources.Load<TextAsset>("Data/world");
            if (ta == null) throw new Exception("Resources/Data/world.json fehlt");
            return JsonUtility.FromJson<WorldDto>(ta.text);
        }
        public static NamesDto LoadNames()
        {
            if (names != null) return names;
            var ta = Resources.Load<TextAsset>("Data/names");
            names = ta != null ? JsonUtility.FromJson<NamesDto>(ta.text) : null;
            return names;
        }

        public static bool Has(int s) { return File.Exists(PathOf(s)); }
        public static bool HasSave { get { for (int i = 1; i <= Slots; i++) if (Has(i)) return true; return false; } }

        public static SlotMeta Meta(int s)
        {
            try { if (File.Exists(MetaOf(s))) return JsonUtility.FromJson<SlotMeta>(File.ReadAllText(MetaOf(s))); } catch (Exception) { }
            return Has(s) ? new SlotMeta { club = "Spielstand", saved = File.GetLastWriteTime(PathOf(s)).ToString("dd.MM.yyyy HH:mm") } : null;
        }

        public static void Save(Game g)
        {
            var s = g.S; string json = JsonUtility.ToJson(s);
            string path = PathOf(Slot), tmp = path + ".tmp";
            using (var fs = File.Create(tmp))
            using (var gz = new GZipStream(fs, System.IO.Compression.CompressionLevel.Fastest))
            { var b = Encoding.UTF8.GetBytes(json); gz.Write(b, 0, b.Length); }
            if (File.Exists(path)) File.Delete(path);
            File.Move(tmp, path);
            var l = s.fav >= 0 ? g.LeagueOf(s.fav) : null;
            var m = new SlotMeta { club = s.fav >= 0 ? g.T(s.fav).name : (g.IsCareer ? "Ohne Verein" : "–"), league = l != null ? l.name : "", season = s.season, mode = s.mode, coach = g.IsCareer ? g.C.name : "", saved = DateTime.Now.ToString("dd.MM.yyyy HH:mm") };
            File.WriteAllText(MetaOf(Slot), JsonUtility.ToJson(m));
        }

        public static GameState Load(int s)
        {
            Slot = s;
            using (var fs = File.OpenRead(PathOf(s)))
            using (var gz = new GZipStream(fs, CompressionMode.Decompress))
            using (var rd = new StreamReader(gz, Encoding.UTF8))
                return JsonUtility.FromJson<GameState>(rd.ReadToEnd());
        }
        public static void Delete(int s) { if (Has(s)) File.Delete(PathOf(s)); if (File.Exists(MetaOf(s))) File.Delete(MetaOf(s)); }
        public static int FreeSlot() { for (int i = 1; i <= Slots; i++) if (!Has(i)) return i; return -1; }
    }
}
