// Foto della guida (carenze, malattie, parassiti), chiave = id della voce in guide.js.
// Provengono da Wikimedia Commons con licenza libera; autore e licenza sono mostrati nell'ingrandimento.
// Ogni foto: { file, author, license, page }. File in public/img/guida/<file>-{480,960}.webp.
export const GUIDE_PHOTOS = {
  "carenza-azoto": [
    { file: "carenza-azoto-1", author: "Rasbak", license: "CC BY-SA 3.0", page: "https://commons.wikimedia.org/wiki/File:Phaseolus_vulgaris_nitrogen_deficiency.jpg" },
  ],
  "clorosi-ferrica": [
    { file: "clorosi-ferrica-1", author: "Reznil", license: "Public domain", page: "https://commons.wikimedia.org/wiki/File:ChloroticBlueberryLeaf.JPG" },
    { file: "clorosi-ferrica-2", author: "JonRichfield", license: "CC BY-SA 3.0", page: "https://commons.wikimedia.org/wiki/File:Cinnamomum_camphora_mineral_deficiency_IMG_4396.JPG" },
    { file: "clorosi-ferrica-3", author: "Alandmanson", license: "CC0", page: "https://commons.wikimedia.org/wiki/File:2006_1017_Iron_deficiency_in_peach.JPG" },
  ],
  "carenza-magnesio": [
    { file: "carenza-magnesio-1", author: "Malcolm Manners from Lakeland FL, USA", license: "CC BY 2.0", page: "https://commons.wikimedia.org/wiki/File:Boron_toxicity_(2313046082).jpg" },
    { file: "carenza-magnesio-2", author: "Eiku en exil", license: "CC BY-SA 4.0", page: "https://commons.wikimedia.org/wiki/File:Citrus_limon_leaf_-_unidentified_deficiency.jpg" },
    { file: "carenza-magnesio-3", author: "Alandmanson", license: "CC BY 4.0", page: "https://commons.wikimedia.org/wiki/File:Mg_deficiency_Vulindlela_1995-3-30_2018_01_23_2235.jpg" },
  ],
  "carenza-potassio": [
    { file: "carenza-potassio-1", author: "Goldlocki", license: "CC BY-SA 3.0", page: "https://commons.wikimedia.org/wiki/File:Tomate_Blatt_Kalimangel.jpg" },
    { file: "carenza-potassio-2", author: "Alandmanson", license: "CC BY-SA 4.0", page: "https://commons.wikimedia.org/wiki/File:K-deficient_soyabean_Cedara_2013_02_08_08_24_24_7488.jpg" },
    { file: "carenza-potassio-3", author: "Alandmanson", license: "CC BY-SA 4.0", page: "https://commons.wikimedia.org/wiki/File:K-deficient_dry_bean_2_2012_02_16_Cedara_037.jpg" },
  ],
  "carenza-fosforo": [
    { file: "carenza-fosforo-1", author: "عمرو بن كلثوم", license: "CC BY-SA 2.5", page: "https://commons.wikimedia.org/wiki/File:%D9%86%D9%82%D8%B5_%D8%A7%D9%84%D9%81%D8%B3%D9%81%D9%88%D8%B1_%D8%B9%D9%84%D9%89_%D8%A7%D9%84%D8%B0%D8%B1%D8%A9.jpg" },
    { file: "carenza-fosforo-2", author: "Agronom", license: "CC BY-SA 3.0", page: "https://commons.wikimedia.org/wiki/File:Niedob%C3%B3r_fosforu,_objawy.JPG" },
    { file: "carenza-fosforo-3", author: "Alandmanson", license: "CC0", page: "https://commons.wikimedia.org/wiki/File:2005_1214_0928_Hlokozi_-_Acid-induced_P_deficiency.jpg" },
  ],
  "eccesso-sali": [
    { file: "eccesso-sali-1", author: "Cityside189", license: "CC BY-SA 4.0", page: "https://commons.wikimedia.org/wiki/File:Blueberry_nitrogen_burn.JPG" },
  ],
  "marciume-apicale": [
    { file: "marciume-apicale-1", author: "A13ean", license: "CC BY-SA 3.0", page: "https://commons.wikimedia.org/wiki/File:Blossom_end_rot.JPG" },
    { file: "marciume-apicale-2", author: "Fructibus", license: "CC0", page: "https://commons.wikimedia.org/wiki/File:3_x_Blossom_end_rot_tomato_2017_A.jpg" },
    { file: "marciume-apicale-3", author: "Fructibus", license: "CC0", page: "https://commons.wikimedia.org/wiki/File:Blossom_end_rot_tomato_2017_A.jpg" },
  ],
  "oidio": [
    { file: "oidio-1", author: "Dmitry Brant", license: "CC BY-SA 4.0", page: "https://commons.wikimedia.org/wiki/File:Powdery_mildew_9.jpg" },
    { file: "oidio-2", author: "RoRo", license: "CC0", page: "https://commons.wikimedia.org/wiki/File:Cucurbita_pepo_%27Zucchini_Grey%27_(semiller%C3%ADa_Florensa)_-_first_signs_of_powdery_mildew_(oidio)_on_a_%22mottled_leaf%22.jpg" },
    { file: "oidio-3", author: "Schlaghecken Josef", license: "CC BY-SA 4.0", page: "https://commons.wikimedia.org/wiki/File:Zucchini_Echter-Mehltau_Schlaghecken.jpg" },
  ],
  "ticchiolatura-rosa": [
    { file: "ticchiolatura-rosa-1", author: "", license: "Public domain", page: "https://commons.wikimedia.org/wiki/File:Black_spot.jpg" },
    { file: "ticchiolatura-rosa-2", author: "Stephen James McWilliam", license: "CC0", page: "https://commons.wikimedia.org/wiki/File:Diplocarpon_rosae_85533084.jpg" },
    { file: "ticchiolatura-rosa-3", author: "giantcicada", license: "CC BY 4.0", page: "https://commons.wikimedia.org/wiki/File:Diplocarpon_rosae_123701039.jpg" },
  ],
  "peronospora": [
    { file: "peronospora-1", author: "David B. Langston, University of Georgia, United States", license: "CC BY 3.0", page: "https://commons.wikimedia.org/wiki/File:Downy_mildew_on_watermelon_2.jpg" },
    { file: "peronospora-2", author: "Roswitha Ulrich, Pflanzenschutz Beratung in Hessen", license: "CC BY 4.0", page: "https://commons.wikimedia.org/wiki/File:Rumex_-_Falscher_Mehltau,_Peronospora_rumicis-1-Roswitha_Ulrich,_Pflanzenschutzdienst_Hessen.jpg" },
    { file: "peronospora-3", author: "Dr. Jan Hinrichs-Berger, Landwirtschaftliches Technologiezentrum Augustenberg, K", license: "CC BY 4.0", page: "https://commons.wikimedia.org/wiki/File:Salbei_(Salvia_officinalis)_mit_einem_Peronospora_salviae-officinalis_Befall_-_Hinrichs-Berger-2.jpg" },
  ],
  "ruggine": [
    { file: "ruggine-1", author: "Michel Langeveld", license: "CC BY-SA 4.0", page: "https://commons.wikimedia.org/wiki/File:Puccinia_malvacearum_184020347.jpg" },
    { file: "ruggine-2", author: "Michel Langeveld", license: "CC BY-SA 4.0", page: "https://commons.wikimedia.org/wiki/File:Puccinia_malvacearum_184020350.jpg" },
    { file: "ruggine-3", author: "This image was created by user Gerhard Koller (Gerhard) at Mushroom Observer, a ", license: "CC BY-SA 3.0", page: "https://commons.wikimedia.org/wiki/File:2008-05-14_Puccinia_malvacearum_60215.jpg" },
  ],
  "botrite": [
    { file: "botrite-1", author: "Rasbak", license: "CC BY-SA 3.0", page: "https://commons.wikimedia.org/wiki/File:Aardbei_Lambada_vruchtrot_Botrytis_cinerea.jpg" },
    { file: "botrite-2", author: "Flowersabc", license: "CC BY-SA 2.0", page: "https://commons.wikimedia.org/wiki/File:Botrytis_cinerea.jpg" },
    { file: "botrite-3", author: "Schlaghecken Josef", license: "CC BY 4.0", page: "https://commons.wikimedia.org/wiki/File:Himbeere_(Rubus_idaeus)_mit_Grauschimmel_(Botrytis_cinerea)-Josef_Schlaghecken.jpg" },
  ],
  "marciume-radicale": [
    { file: "marciume-radicale-1", author: "Scot Nelson from Honolulu, Hawaii, USA", license: "CC0", page: "https://commons.wikimedia.org/wiki/File:Aaili-root-rot-phytophthora_(5688738988).jpg" },
    { file: "marciume-radicale-2", author: "Jerzy Opioła", license: "CC BY-SA 4.0", page: "https://commons.wikimedia.org/wiki/File:Rhododendron-Phytophthora_Root_Rot_(2).jpg" },
    { file: "marciume-radicale-3", author: "Jerzy Opioła", license: "CC BY-SA 4.0", page: "https://commons.wikimedia.org/wiki/File:Rhododendron-Phytophthora_Root_Rot_(3).jpg" },
  ],
  "fumaggine": [
    { file: "fumaggine-1", author: "Amnon Shavit", license: "CC BY-SA 3.0", page: "https://commons.wikimedia.org/wiki/File:Sooty_mold_Schefflera_1.JPG" },
    { file: "fumaggine-2", author: "Amnon Shavit", license: "CC BY-SA 3.0", page: "https://commons.wikimedia.org/wiki/File:Sooty_mold_Schefflera_2.JPG" },
    { file: "fumaggine-3", author: "Wee Hong", license: "CC BY-SA 4.0", page: "https://commons.wikimedia.org/wiki/File:Sooty_mould_on_leaves_of_Morus_nigra.jpg" },
  ],
  "bolla-pesco": [
    { file: "bolla-pesco-1", author: "Eiku", license: "CC BY-SA 4.0", page: "https://commons.wikimedia.org/wiki/File:Leaf_curl_on_peach_tree_-_curled_leaf_(detail).jpg" },
    { file: "bolla-pesco-2", author: "Dr Mary Gillham Archive Project", license: "CC BY 2.0", page: "https://commons.wikimedia.org/wiki/File:Peach_leaf_curl,_Taphrina_deformans,_Ealing,_June_1977_(31021750205).jpg" },
    { file: "bolla-pesco-3", author: "Giancarlo Dessì", license: "CC BY-SA 3.0", page: "https://commons.wikimedia.org/wiki/File:Taphrina_deformans_1.jpg" },
  ],
  "afidi": [
    { file: "afidi-1", author: "Fir0002", license: "GFDL 1.2", page: "https://commons.wikimedia.org/wiki/File:Aphids_feeding_on_fennel.jpg" },
    { file: "afidi-2", author: "Alvesgaspar", license: "CC BY-SA 4.0", page: "https://commons.wikimedia.org/wiki/File:Aphids_September_2008-1.jpg" },
    { file: "afidi-3", author: "Carlos Delgado", license: "CC BY-SA 3.0", page: "https://commons.wikimedia.org/wiki/File:Lasius_niger_y_Cinara_tujafilina_en_Thuja_orientalis.jpg" },
  ],
  "cocciniglie": [
    { file: "cocciniglie-1", author: "Alexlutor", license: "CC BY-SA 3.0", page: "https://commons.wikimedia.org/wiki/File:Mealybugs_feeding_on_hibiscus_plant.jpg" },
    { file: "cocciniglie-2", author: "Forest and Kim Starr", license: "CC BY 3.0 us", page: "https://commons.wikimedia.org/wiki/File:Starr-130914-1506-Ipomoea_pes_caprae_subsp_brasiliensis-leaf_with_whitefly_or_mealybug_near_lake-NE_Inland-Laysan_(24929379870).jpg" },
    { file: "cocciniglie-3", author: "Jacopo Werther", license: "CC BY-SA 3.0", page: "https://commons.wikimedia.org/wiki/File:Coccoidea_on_Bougainvillea_leaf.jpg" },
  ],
  "ragnetto-rosso": [
    { file: "ragnetto-rosso-1", author: "Ante Perkovic", license: "CC BY-SA 3.0", page: "https://commons.wikimedia.org/wiki/File:Tetranychus_urticae_20080601_032.jpg" },
    { file: "ragnetto-rosso-2", author: "Gilles San Martin", license: "CC BY-SA 2.0", page: "https://commons.wikimedia.org/wiki/File:Tetranychus_urticae_with_silk_threads.jpg" },
    { file: "ragnetto-rosso-3", author: "Natalka Ukraine (baby-bear.org)", license: "CC BY 4.0", page: "https://commons.wikimedia.org/wiki/File:Solanum_lycopersicum_leaves_with_spider_mite_or_thrips_damage_in_Dnipro_by_baby-bear.org.jpg" },
  ],
  "oziorrinco": [
    { file: "oziorrinco-1", author: "Opuntia", license: "CC BY-SA 3.0", page: "https://commons.wikimedia.org/wiki/File:Otiorhynchus_sulcatus_23-8-2007_20-10-41.JPG" },
    { file: "oziorrinco-2", author: "Holger Krisp", license: "CC BY 4.0", page: "https://commons.wikimedia.org/wiki/File:Gefurchte_Dickmaulr%C3%BCssler_Otiorhynchus_sulcatus_1.jpg" },
    { file: "oziorrinco-3", author: "Holger Krisp", license: "CC BY 4.0", page: "https://commons.wikimedia.org/wiki/File:Gefurchte_Dickmaulr%C3%BCssler_Otiorhynchus_sulcatus_2.jpg" },
  ],
  "piralide-bosso": [
    { file: "piralide-bosso-1", author: "böhringer friedrich", license: "CC BY-SA 2.5", page: "https://commons.wikimedia.org/wiki/File:Raupe_des_Buchsbaumz%C3%BCnsler,_Cydalima_perspectalis_24.JPG" },
    { file: "piralide-bosso-2", author: "Qflieger", license: "CC BY-SA 3.0", page: "https://commons.wikimedia.org/wiki/File:Cydalima_perspectalis_011997.jpg" },
    { file: "piralide-bosso-3", author: "Franz van Duns", license: "CC BY-SA 4.0", page: "https://commons.wikimedia.org/wiki/File:Caterpillar_of_box_tree_moth_feeding_on_box_tree_leaf,_Germany_2019_(_DSC2013-1).jpg" },
  ],
  "popillia": [
    { file: "popillia-1", author: "Bruce Marlin", license: "CC BY 3.0", page: "https://commons.wikimedia.org/wiki/File:Popillia_japonica.jpg" },
    { file: "popillia-2", author: "Ryan Hodnett", license: "CC BY-SA 4.0", page: "https://commons.wikimedia.org/wiki/File:Japanese_Beetle_(Popillia_japonica).jpg" },
    { file: "popillia-3", author: "Paul Harrison", license: "CC BY-SA 4.0", page: "https://commons.wikimedia.org/wiki/File:Popillia_japonica_Japanese_Beetle_05.jpg" },
  ],
  "cimice-asiatica": [
    { file: "cimice-asiatica-1", author: "David R. Lance, USDA APHIS PPQ", license: "CC BY 3.0 us", page: "https://commons.wikimedia.org/wiki/File:Brown_marmorated_stink_bug_adult.jpg" },
    { file: "cimice-asiatica-2", author: "Yerpo", license: "CC BY-SA 3.0", page: "https://commons.wikimedia.org/wiki/File:Halyomorpha_halys_nymph_lab.jpg" },
    { file: "cimice-asiatica-3", author: "Rhododendrites", license: "CC BY-SA 4.0", page: "https://commons.wikimedia.org/wiki/File:Brown_marmorated_stink_bug_(42166).jpg" },
  ],
  "mosca-bianca": [
    { file: "mosca-bianca-1", author: "Chirag85", license: "CC BY-SA 4.0", page: "https://commons.wikimedia.org/wiki/File:Silverleaf_Whitefly_(Bemisia_tabaci)_adult.jpg" },
    { file: "mosca-bianca-2", author: "Sanja565658", license: "CC BY-SA 3.0", page: "https://commons.wikimedia.org/wiki/File:Trialeurodes_vaporariorum_01.JPG" },
    { file: "mosca-bianca-3", author: "NobbiP", license: "CC BY-SA 3.0", page: "https://commons.wikimedia.org/wiki/File:Gew%C3%A4chshaus-Wei%C3%9Fe_Fliege_Trialeurodes_vaporariorum_5226.jpg" },
  ],
  "tuta": [
    { file: "tuta-1", author: "Marja van der Straten, NVWA Plant Protection Service, Bugwood.org", license: "CC BY 3.0 us", page: "https://commons.wikimedia.org/wiki/File:Tuta_absoluta_5432149.jpg" },
    { file: "tuta-2", author: "Ben Sale from Stevenage, UK", license: "CC BY 2.0", page: "https://commons.wikimedia.org/wiki/File:Tuta_absoluta_(52465714396).jpg" },
  ],
  "punteruolo": [
    { file: "punteruolo-1", author: "Noblevmy at Malayalam Wikipedia", license: "CC BY 3.0", page: "https://commons.wikimedia.org/wiki/File:%E0%B4%9A%E0%B5%86%E0%B4%AE%E0%B5%8D%E0%B4%AA%E0%B5%BB%E0%B4%9A%E0%B5%86%E0%B4%B2%E0%B5%8D%E0%B4%B2%E0%B4%BF.JPG" },
    { file: "punteruolo-2", author: "Palauenc05", license: "CC BY-SA 4.0", page: "https://commons.wikimedia.org/wiki/File:Rhynchophorus_ferrugineus_(pupa)-2.jpg" },
    { file: "punteruolo-3", author: "Smailtn", license: "CC BY-SA 4.0", page: "https://commons.wikimedia.org/wiki/File:Charan%C3%A7on_rouge_des_palmiers_(Rhynchophorus_ferrugineus).jpg" },
  ],
  "lumache": [
    { file: "lumache-1", author: "Hans Hillewaert", license: "CC BY-SA 4.0", page: "https://commons.wikimedia.org/wiki/File:Arion_rufus_(Dourbes).jpg" },
    { file: "lumache-2", author: "Tobias \"ToMar\" Maier", license: "CC BY-SA 3.0", page: "https://commons.wikimedia.org/wiki/File:Small_group_of_Arion_rufus_-_good_view_on_the_side_hole.jpg" },
    { file: "lumache-3", author: "Didier Descouens", license: "CC BY-SA 4.0", page: "https://commons.wikimedia.org/wiki/File:Limax_maximus_MHNT.jpg" },
  ],
  "processionaria": [
    { file: "processionaria-1", author: "Christian Ferrer", license: "CC BY-SA 4.0", page: "https://commons.wikimedia.org/wiki/File:Thaumetopoea_pityocampa_-_Nid_de_chenilles_processionnaires_du_pin,_S%C3%A8te_02.jpg" },
    { file: "processionaria-2", author: "Fernando Losada Rodríguez", license: "CC BY-SA 4.0", page: "https://commons.wikimedia.org/wiki/File:Thaumetopoea_pityocampa.001_-_Zamora.jpg" },
    { file: "processionaria-3", author: "Chiswick Chap", license: "CC BY-SA 3.0", page: "https://commons.wikimedia.org/wiki/File:Nest_of_Pine_Processionary_Moth_caterpillars_(plague_this_year)_in_Scots_Pine.JPG" },
  ],
};
