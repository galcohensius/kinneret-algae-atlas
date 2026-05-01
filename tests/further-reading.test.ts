import { describe, expect, it } from "vitest";
import { citationToScholarSearchUrl, splitFurtherReadingCitations } from "../lib/further-reading";

/** Join lines with \n as the extractor produces (one paragraph = one citation). */
function fr(...lines: string[]): string {
  return lines.join("\n");
}

describe("splitFurtherReadingCitations", () => {
  it("example 1: single citation", () => {
    const text = fr(
      "Hansen G, Flaim G. 2007. Dinoflagellates of the Trentino province, Italy. Journal of Limnology. 66(2):107-41."
    );
    const parts = splitFurtherReadingCitations(text);
    expect(parts).toHaveLength(1);
    expect(parts[0]).toContain("Hansen G");
  });

  it("example 2: two citations", () => {
    const text = fr(
      "Pollingher U, Hickel B. 1991. Dinoflagellate associations in a subtropical lake (Lake Kinneret, Israel). Arch Hydrobiol 120:267-285",
      "Hansen G, Flaim G. 2007. Dinoflagellates of the Trentino province, Italy. Journal of Limnology. 66(2):107-41."
    );
    const parts = splitFurtherReadingCitations(text);
    expect(parts).toHaveLength(2);
    expect(parts[0]).toContain("Pollingher U");
    expect(parts[1]).toContain("Hansen G");
  });

  it("example 3: two citations, first ends with 'Berlin: Springer Spektrum'", () => {
    const text = fr(
      "Moestrup Ø, Calado AJ. 2018. Süßwasserflora von Mitteleuropa. Dinophyceae. Vol. 6 pp. [i]-xii, [1]-560, 421 figures. Berlin: Springer Spektrum.",
      "Pollingher U, Hickel B. 1991. Dinoflagellate associations in a subtropical lake (Lake Kinneret, Israel). Archiv für Hydrobiologie 120(3):267-85."
    );
    const parts = splitFurtherReadingCitations(text);
    expect(parts).toHaveLength(2);
    expect(parts[0]).toContain("Moestrup");
    expect(parts[0]).toContain("Berlin: Springer Spektrum");
    expect(parts[1]).toContain("Pollingher U");
  });

  it("example 4: three citations (blank paragraphs between them are filtered out)", () => {
    const text = fr(
      "Berman-Frank I, Zohary T, Erez J, Dubinsky Z (1994) CO2 availability, carbonic anhydrase, and the annual dinoflagellate bloom in Lake Kinneret. Limnol Oceanogr. 39:1822-1834.",
      "Pollingher U, Hickel B (1991) Dinoflagellate associations in a subtropical lake (Lake Kinneret, Israel). Arch. Hydrobiol. 120:267-285.",
      "Zohary T, Erez J, Gophen M, Berman-Frank I, Stiller M (1994) Seasonality of stable carbon isotopes within the pelagic food web of Lake Kinneret. Limnol. Oceanogr. 39:1030-1043."
    );
    const parts = splitFurtherReadingCitations(text);
    expect(parts).toHaveLength(3);
    expect(parts[0]).toContain("Berman-Frank");
    expect(parts[1]).toContain("Pollingher U");
    expect(parts[2]).toContain("Zohary T");
  });

  it("example 5: three citations including a very long multi-author entry", () => {
    const text = fr(
      "Hansen G, Flaim G. 2007. Dinoflagellates of the Trentino Province, Italy. J Limnol. 66:107-141.",
      "Pandeirada MS, Craveiro SC, Daugbjerg N, Moestrup Ø, Calado AJ. 2022. Ultrastructure and phylogeny of Parvodinium cunningtonii comb. nov. (syn. Peridiniopsis cunningtonii) and description of P. cunningtonii var. inerme var. nov. (Peridiniopsidaceae, Dinophyceae). Eur J Protistol. 86:125930.",
      "Pollingher U, Hickel B. 1991. Dinoflagellate associations in a subtropical lake (Lake Kinneret, Israel). Arch Hydrobiol. 120:267-285."
    );
    const parts = splitFurtherReadingCitations(text);
    expect(parts).toHaveLength(3);
    expect(parts[0]).toContain("Hansen G");
    expect(parts[1]).toContain("Pandeirada");
    expect(parts[2]).toContain("Pollingher U");
  });

  it("example 6: two citations", () => {
    const text = fr(
      "Hansen G, Flaim G. 2007. Dinoflagellates of the Trentino Province, Italy. J Limnol. 66:107-141.",
      "Pollingher U, Hickel B. 1991. Dinoflagellate associations in a subtropical lake (Lake Kinneret, Israel). Arch Hydrobiol. 120:267-285."
    );
    const parts = splitFurtherReadingCitations(text);
    expect(parts).toHaveLength(2);
    expect(parts[0]).toContain("Hansen G");
    expect(parts[1]).toContain("Pollingher U");
  });

  it("example 7: single citation with 'Jena & Stuttgart: Gustav Fischer' stays whole", () => {
    const text = fr(
      "Popovsky J, Pfiester LA. 1990. Süßwasserflora von Mitteleuropa. Dinophyceae (Dinoflagellida). Vol. 6 pp. 1-272. Jena & Stuttgart: Gustav Fischer."
    );
    const parts = splitFurtherReadingCitations(text);
    expect(parts).toHaveLength(1);
    expect(parts[0]).toContain("Jena & Stuttgart: Gustav Fischer");
  });

  it("example 8: four citations, last ends with 'Jena & Stuttgart: Gustav Fischer'", () => {
    const text = fr(
      "Hansen G, Flaim G. 2007. Dinoflagellates of the Trentino Province, Italy. J Limnol. 66:107-141.",
      "Penard E. 1891. Les Peridiniacees du Lac Leman. Bull. Trav. Soc. Bot. Geneve 6: 1-63.",
      "Pollingher U, Hickel B. 1991. Dinoflagellate associations in a subtropical lake (Lake Kinneret, Israel). Arch. Hydrobiol. 120: 267-285.",
      "Popovsky, J. & Pfiester, L.A. 1990. Süßwasserflora von Mitteleuropa. Dinophyceae (Dinoflagellida). Vol. 6 pp. 1-272. Jena & Stuttgart: Gustav Fischer."
    );
    const parts = splitFurtherReadingCitations(text);
    expect(parts).toHaveLength(4);
    expect(parts[0]).toContain("Hansen G");
    expect(parts[1]).toContain("Penard E");
    expect(parts[2]).toContain("Pollingher U");
    expect(parts[3]).toContain("Popovsky");
    expect(parts[3]).toContain("Jena & Stuttgart: Gustav Fischer");
  });

  it("example 9: large Peridinium gatunense reference list (50 citations)", () => {
    const text = fr(
      "Alster A, Zohary T (2007) Interactions between the bloom forming dinoflagellate Peridinium gatunense and the chytrid fungus Phlyctochytrium sp. Hydrobiologia 578:131-139.",
      "Alster A, Zohary T, Dubinsky Z (2006) Peridinium gatunense cyst type, abundance and germination in Lake Kinneret. Verh Internat Verein Limnol 29:2083-2086.",
      "Berman T, Dubinsky Z (1985) The autecology of Peridinium cinctum fa.westii from Lake Kinneret. Verh Internat Verein Limnol 22:2850-2854.",
      "Berman T, Rodhe W (1971) Distribution and migration of Peridinium in Lake Kinneret. Mitteilungen Internationale Vereinigung für Theoretische und Angewandte Limnologie 19:266-276.",
      "Berman T, Sherr BF, Sherr E, Wynne D, McCarthy JJ (1984) The characteristics of ammonium and nitrate uptake by phytoplankton in Lake Kinneret. Limnol Oceanogr 29:287-297.",
      "Berman T, Shteinman B (1998) Phytoplankton development and turbulent mixing in Lake Kinneret (1992-1996). J Plankton Res 20:709-726.",
      "Berman-Frank I, Erez J (1996) Inorganic carbon pools in the bloom-forming dinoflagellate Peridinium gatunense. Limnol Oceanogr 41:1780-1789.",
      "Berman-Frank I, Zohary T, Erez J, Dubinsky Z (1994) CO2 availability, carbonic anhydrase, and the annual dinoflagellate bloom in Lake Kinneret. Limnol Oceanogr 39:1822-1834.",
      "Boltovskoy A (1983) Peridinium cinctum f. westii del Mar de Galilea, sinonimo de Peridinium gatunense (Dinophyceae). Limnobios 2:413-418.",
      "Butow B, Wynne D, Sukenik A, Hadas O, Tel-Or E (1998) The synergistic effect of carbon concentration and high temperature on lipid peroxidation in Peridinium gatunense. J Phycol 20:355-369.",
      "Elgavish A, Elgavish GA, Halman M, Berman T (1980) Phosphorus utilization and storage in batch cultures of the dinoflagellate Peridinium cinctum fa. westii. J Phycol 16:626-633.",
      "Eren J (1969) Studies of development cycle of Peridinium cinctum fa. westii. Verh Internat Verein Limnol 17:1013-1016.",
      "Hader D-P, Liu S-M, Hader M, Ullrich W (1990) Photoorientation, motility and pigmentation in a freshwater Peridinium affected by ultraviolet radiation. Gen Physiol Biophys 9:361-371.",
      "Hambright KD, Zohary T, Gude H (2007) Microzooplankton dominate carbon flow and nutrient cycling in a warm subtropical freshwater lake. Limnol Oceanogr 52 (3):1018-1025.",
      "Hickel B, Pollingher U (1988) Identification of the bloom forming Peridinium from Lake Kinneret (Israel) as P. gatunense (Dinophyceae). Br Phycol J23:115-119.",
      "Hansen G, Flaim G (2007) Dinoflagellates of the Trentino Province, Italy. J Limnol. 66:107-141.",
      "Lindström K (1984) Effect of temperature, light and pH on growth, photosynthesis and respiration of the dinoflagellate Peridinium cinctum fa. westii in laboratory cultures. J Phycol 20:212-220.",
      "Lindström K (1991) Nutrient requirements of the dinoflagellate Peridinium gatunense. J Phycol 27:207-219.",
      "Liu S-M, Hader D-P, Ullrich W (1990) Photoorientation in the freshwater dinoflagellate, Peridinium gatunense Nygaard. FEMS Microbiol Let 73:91-101.",
      "McCarthy JJ, Wynne D, Berman T (1982) The uptake of dissolved nitrogenous nutrients by Lake Kinneret, Israel microplankton. Limnol Oceanogr 27:673-680.",
      "Messer G, Ben Shaul Y (1969) Fine structure of Peridinium westii, a freshwater dinoflagellate. J Protozool 15:272-280.",
      "Murik O, Kaplan A (2009) Paradoxically, prior acquisition of antioxidant activity enhances oxidative stress-induced cell death. Environ Microbiol 11 (9):2301-2309.",
      "Nevo Z, Sharon N (1969) The cell wall of Peridinium westii, a non cellilosic glucan. Biochim Biophys Acta 173:161-175.",
      "Pfiester LA (1977) Sexual reproduction of Peridinium gatunense (Dinophyceae). J Phycol 13:92-95.",
      "Pollingher U (1986) Phytoplankton periodicity in a subtropical lake (Lake Kinneret, Israel). Hydrobiologia 138:127-138.",
      "Pollingher U (1988) Freshwater armored dinoflagellates: growth, reproductive strategies and population dynamics. In: Sandgren C (ed) Growth and Reproduction Strategies of Freshwater Phytoplankton. Cambridge University Press, Cambridge, pp 134-174.",
      "Pollingher U, Hickel B (1991) Dinoflagellate associations in a subtropical lake (Lake Kinneret, Israel). Arch Hydrobiol 120:267-285.",
      "Pollingher U, Serruya C (1976) Phased division of Peridinium cinctum fa. westii (Dinophyceae) and development of the Lake Kinneret, Israel bloom. J Phycol 12:162-170.",
      "Pollingher U, Zemel E (1981) In situ and experimental evidence of the influence of turbulence on cell division processes of Peridinium cinctum fa.westii. (Lemm.) Lefevre. Br Phycol J 16:281-287.",
      "Rahat M (1968) Observations on the life cycle of Peridinium westii in a mixed culture. Isr J Bot 17:200-206.",
      "Rodhe W (1978) Peridinium cinctum fa. westii (Lemm.) Lef.: growth characteristics. In: Serruya C (ed) Lake Kinneret. Dr. Junk Publishers, The Hague, pp 275-283.",
      "Serruya C, Gophen M, Pollingher U (1980) Lake Kinneret: Carbon flow patterns and ecosystems management. Arch Hydrobiol 88:265-302.",
      "Sherr B, Sherr E, Berman T (1982) Decomposition of organic detritus: a selective role for microflagellate protozoa. Limnol Oceanogr 27:765-769.",
      "Spataru P, Zorn M (1976) Some aspects of natural food and feeding habits of Tilapia galilaea (Artedi) and Tiplapia aurea (Steindachner) in Lake Kinneret. Bamidgeh, The Isr J Aquaculture 28:12-17.",
      "Sukenik A, Eshkol R, Livne A, Hadas O, Rom M, Tchernov D, Vardi A, Kaplan A (2002) Inhibition of growth and photosynthesis of the dinoflagellate Peridinium gatunense by Microcystis sp.(cyanobacteria): a novel allelopathic mechanism. Limnol Oceanogr 47:1656-1663.",
      "Usvyatsov S, Zohary T (2006) Lake Kinneret continuous time-depth chlorophyll record highlights major phytoplankton events. Verh Internat Verein Limnol 29:1131-1134.",
      "Vardi A, Berman-Frank I, Rozenberg T, Hadas O, Kaplan A, Levine A (1999) Programmed cell death of the dinoflagellate Peridinium gatunense is mediated by CO2 limitation and oxidative stress. Current Biol 9:1061-1064.",
      "Vardi A, Eisenstadt D, Murik O, Berman-Frank I, Zohary T, Levine A, Kaplan A (2007) Synchronization of cell death in a dinoflagellate population is mediated by an excreted thiol protease. Environ Microbiol 9:360-369.",
      "Vardi A, Schatz D, Beeri K, Motro U, Sukenik A, Levine A, Kaplan A (2002) Dinoflagellate-cyanobacterium communication may determine the composition of phytoplankton assemblage in a mesotrophic lake. Current Biol 12:1767-1772.",
      "Wynne D (1981) Phosphorus, phosphatases and the Peridinium bloom in Lake Kinneret. Verh Internat Verein Limnol 21:523-527.",
      "Wynne D, Patni NJ, Aaronson S, Berman T (1982) The relationship between nutrient status and chemical composition of Peridinium cinctum during the bloom in Lake Kinneret. J Plankton Res 4:125-136.",
      "Yacobi YZ, Pollingher U, Gonen Y, Gerhard V, Sukenik A (1996) HPLC analysis of phytoplankton pigments from Lake Kinneret with special reference to the bloom-forming dinoflagellate Peridinium gatunense (Diniophyceae) and chlorophyll degradation products. J Plankton Res 18:1781-1796.",
      "Yacobi YZ, Zohary T (2010) Carbon:chlorophyll a ratio, assimilation numbers and turnover times of Lake Kinneret phytoplankton. Hydrobiologia 639:185-196.",
      "Zohary T (2004) Changes to the phytoplankton assemblage of Lake Kinneret after decades of a predictable, repetitive pattern. Freshwat Biol 49:1355-1371.",
      "Zohary T, Erez J, Gophen M, Berman-Frank I, Stiller M (1994) Seasonality of stable carbon isotopes with Lake Kinneret pelagic food web. Limnol Oceanogr 39:1030-1043.",
      "Zohary T, Hadas O, Pollingher U, Kaplan B, Pinkas R, Güde H (2000) The effect of nutrients (N, P) on the decomposition of Peridinium gatunense cells and thecae. Limnol Oceanogr 45:123-130.",
      "Zohary T, Nishri A, Sukenik A (2012) Present-absent: a chronicle of the dinoflagellate Peridinium gatunense from Lake Kinneret. Hydrobiologia 698:161-174.",
      "Zohary T, Pollingher U, Hadas O, Hambright KD (1998) Bloom dynamics and sedimentation of Peridinium gatunense in Lake Kinneret. Limnol Oceanogr 43:175-186.",
      "Zohary T, Sukenik A, Berman T (2014). Peridinium gatunense. Chap. 11 In: Zohary T, Sukenik A, Berman T, Nishri A. [eds] Lake Kinneret: Ecology and Management, pp 191-212. Springer, Heidelberg.",
      "Zohary T, Alster A, Cummings D, Dolev A, Eckert W, Gal G, Gasith A, Guk E, Leibovici E, Ofir E, Varulker S, Be'eri-Shlevin Y. 2026. Inundated Tamarix forest – a novel, climate change-induced littoral habitat in Lake Kinneret. Inland Waters 16(1), 2557696 https://doi.org/10.1080/20442041.2025.2557696"
    );
    const parts = splitFurtherReadingCitations(text);
    expect(parts).toHaveLength(50);
    expect(parts[0]).toContain("Alster A");
    expect(parts[parts.length - 1]).toContain("Tamarix");
  });

  it("trailing period is added when missing", () => {
    const text = fr("Pollingher U, Hickel B. 1991. Some journal 120:267-285");
    const parts = splitFurtherReadingCitations(text);
    expect(parts[0]).toMatch(/285\.$/);
  });

  it("empty lines between citations are ignored", () => {
    const text = "Citation one.\n\n\nCitation two.";
    const parts = splitFurtherReadingCitations(text);
    expect(parts).toHaveLength(2);
  });
});

describe("citationToScholarSearchUrl", () => {
  it("encodes query for Google Scholar", () => {
    const url = citationToScholarSearchUrl("Test Author (1999) Title here.");
    expect(url).toContain("scholar.google.com");
    expect(url).toContain(encodeURIComponent("Test Author (1999) Title here."));
  });
});
