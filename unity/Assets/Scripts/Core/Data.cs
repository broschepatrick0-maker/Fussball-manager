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
    [Serializable] public class HistEntry { public int season; public string league; public int level; public int pos; public int n; public int pts; public string cups; }
    [Serializable] public class TeamHist { public int team; public List<HistEntry> e = new List<HistEntry>(); }

    [Serializable]
    public class GameState
    {
        public int version = 1;
        public int season; public int day; public int lastDay; public bool done;
        public int fav = -1; public int seed;
        public string mode = "free"; public Career career;
        public List<Fin> fin = new List<Fin>();
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
        public List<KV> pokalWinners = new List<KV>();
        public List<KV> kpWinners = new List<KV>();
        public List<int> lastL3 = new List<int>();
    }
}
