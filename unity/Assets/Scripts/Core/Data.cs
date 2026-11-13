// Datenformate: so liegen Welt und Namen in Resources/Data (aus der Web-App exportiert)
// und so wird der Spielstand gespeichert. Nur öffentliche Felder, damit JsonUtility (Unity)
// und System.Text.Json (Test ohne Unity) dieselben Klassen lesen und schreiben können.
using System;
using System.Collections.Generic;

namespace FP.Core
{
    [Serializable] public class KV { public string k; public string v; }
    [Serializable] public class KW { public string k; public float w; }

    // ---------- Export der Web-App ----------
    [Serializable] public class TeamDto { public string name; public string vb; public string cc; public float r; public string crest; public string c1; public string c2; }
    [Serializable] public class LeagueDto { public string id; public string name; public int level; public string vb; public string vbs; public string kreis; public string up; public bool foreign; public string cc; public string title; public List<int> teams; }
    [Serializable] public class PlayerDto { public string n; public string p; public int a; public string nat; public float s; public int no; }
    [Serializable] public class SquadDto { public int team; public List<PlayerDto> players; }
    [Serializable] public class WorldDto
    {
        public int season; public string exported;
        public List<KV> region; public List<KV> homeSeed;
        public List<TeamDto> teams; public List<LeagueDto> leagues;
        public List<int> pool; public List<SquadDto> squads;
    }
    [Serializable] public class NatDto { public string code; public string name; public List<string> first; public List<string> last; }
    [Serializable] public class NamesDto { public List<NatDto> nat; public List<float> foreignShare; public List<KW> top; public List<KW> low; public List<KW> mix; }

    // ---------- Laufender Spielstand ----------
    [Serializable] public class Match { public int h; public int a; public int hg = -1; public int ag = -1; }
    [Serializable] public class Round { public List<Match> m = new List<Match>(); }

    [Serializable]
    public class Team
    {
        public int id; public string name; public string vb; public string cc;
        public float r; public float fm; public int mo = 60; public int lv;
        public string crest; public string c1; public string c2;
        public List<int> squad = new List<int>();
        public List<string> from = new List<string>();   // Ligen, aus denen der Verein aufgestiegen ist (für die Rückkehr beim Abstieg)
        public List<KV> hm = new List<KV>();              // Heimatliga je Spielklasse
    }

    [Serializable]
    public class League
    {
        public string id; public string name; public int level; public string vb; public List<string> vbs = new List<string>();
        public string kreis; public string up; public bool foreign; public string cc; public string title;
        public int size; public int tgt;
        public List<int> teams = new List<int>();
        public List<Round> rounds = new List<Round>();
        public List<int> dates = new List<int>();
        public int played;
    }

    [Serializable] public class Player { public int id; public string n; public string p; public int a; public string nat; public float s; public int no; public bool real; }
    [Serializable] public class SeasonLog { public int season; public List<string> lines = new List<string>(); }
    [Serializable] public class Parked { public int id; public string lg; }
    [Serializable] public class HistEntry { public int season; public string league; public int level; public int pos; public int n; public int pts; }
    [Serializable] public class TeamHist { public int team; public List<HistEntry> e = new List<HistEntry>(); }

    // ---------- Pokale und Europapokal ----------
    // KO-Spiel: a = -1 bei Freilos; ph/pa = Elfmeterschießen (-1 = keins); w = Sieger
    [Serializable] public class CupMatch { public int h; public int a = -1; public int hg = -1; public int ag = -1; public bool et; public int ph = -1; public int pa = -1; public int w = -1; public bool bye; }
    [Serializable] public class CupRound { public List<CupMatch> m = new List<CupMatch>(); }
    [Serializable]
    public class Cup
    {
        public string id; public string name; public string type; public string vb = ""; public string kreis = "";   // type: dfb, lp (Landespokal), kp (Kreispokal)
        public List<int> teams = new List<int>(); public int R; public int played; public int winner = -1;
        public List<CupRound> rounds = new List<CupRound>(); public List<int> dates = new List<int>();
    }
    // Europapokal-Duell: Hin- und Rückspiel (bzw. Finale auf neutralem Platz); a = schlechter gesetzt
    [Serializable] public class EuroTie { public int a; public int b; public CupMatch l1 = new CupMatch(); public CupMatch l2 = new CupMatch(); public bool twoLegs; public int ga; public int gb; public int pa = -1; public int pb = -1; public int w = -1; public bool final; }
    [Serializable] public class EuroKo { public string name; public List<EuroTie> ties = new List<EuroTie>(); }
    [Serializable]
    public class Euro
    {
        public string id; public string name; public string shortName; public int nmd; public int step; public int winner = -1;
        public List<int> teams = new List<int>(); public List<Round> mds = new List<Round>(); public List<EuroKo> ko = new List<EuroKo>();
        public List<int> seed = new List<int>(); public List<int> dates = new List<int>();
    }
    // Titel eines Vereins (Liga, Pokal, Europapokal)
    [Serializable] public class Title { public int team; public int season; public string comp; public string kind; public int lv; }   // kind: liga, dfb, lp, kp, ucl, uel, uecl
    [Serializable] public class Qual { public List<int> ucl = new List<int>(); public List<int> uel = new List<int>(); public List<int> uecl = new List<int>(); }

    [Serializable]
    public class GameState
    {
        public int version = 2;
        public int season; public int day; public int lastDay; public bool done;
        public int fav = -1; public int seed;
        public List<Team> teams = new List<Team>();
        public List<League> leagues = new List<League>();
        public List<Player> players = new List<Player>();
        public List<int> pool = new List<int>();
        public List<KV> region = new List<KV>();
        public List<KV> homeSeed = new List<KV>();
        public List<Parked> parked = new List<Parked>();
        public List<SeasonLog> log = new List<SeasonLog>();
        public List<TeamHist> hist = new List<TeamHist>();
        public List<string> lastRel = new List<string>();
        public List<Cup> cups = new List<Cup>();
        public List<Euro> euro = new List<Euro>();
        public List<KV> lpWinners = new List<KV>();   // Verband → Landespokalsieger der Vorsaison (Startplatz im DFB-Pokal)
        public List<KV> kpWinners = new List<KV>();   // Verband|Kreis → Kreispokalsieger (Startplatz im Landespokal)
        public List<int> lastL3 = new List<int>();     // Abschlusstabelle 3. Liga (beste Nicht-Aufsteiger in den DFB-Pokal)
        public Qual qual = new Qual(); public bool hasQual;
        public List<Title> titles = new List<Title>();
    }
}
