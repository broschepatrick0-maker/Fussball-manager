// Laden der Startdaten aus Resources/Data und Speichern des Spielstands (gzip-JSON im persistentDataPath).
using System;
using System.IO;
using System.IO.Compression;
using System.Text;
using UnityEngine;
using FP.Core;

namespace FP.UI
{
    public static class Store
    {
        static NamesDto names;
        public static string SavePath { get { return Path.Combine(Application.persistentDataPath, "spielstand1.json.gz"); } }

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

        public static bool HasSave { get { return File.Exists(SavePath); } }

        public static void Save(GameState s)
        {
            string json = JsonUtility.ToJson(s);
            string tmp = SavePath + ".tmp";
            using (var fs = File.Create(tmp))
            using (var gz = new GZipStream(fs, System.IO.Compression.CompressionLevel.Fastest))
            {
                var b = Encoding.UTF8.GetBytes(json); gz.Write(b, 0, b.Length);
            }
            if (File.Exists(SavePath)) File.Delete(SavePath);
            File.Move(tmp, SavePath);
        }

        public static GameState Load()
        {
            using (var fs = File.OpenRead(SavePath))
            using (var gz = new GZipStream(fs, CompressionMode.Decompress))
            using (var rd = new StreamReader(gz, Encoding.UTF8))
                return JsonUtility.FromJson<GameState>(rd.ReadToEnd());
        }
        public static void Delete() { if (HasSave) File.Delete(SavePath); }
    }
}
