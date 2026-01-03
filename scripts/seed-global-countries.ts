/**
 * Seed Global Countries
 * Creates 200+ countries based on ISO 3166-1 and UN M49 regions
 * Then links existing country tables to GlobalCountry
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// UN M49 Regions and Sub-regions
interface CountryData {
  iso2: string;
  iso3: string;
  numericCode: string;
  nameEn: string;
  nameAz?: string;
  region: string;
  subRegion: string;
}

// Complete list of countries with UN M49 regions
const countries: CountryData[] = [
  // ============ EUROPE ============
  // Northern Europe
  { iso2: "DK", iso3: "DNK", numericCode: "208", nameEn: "Denmark", nameAz: "Danimarka", region: "Europe", subRegion: "Northern Europe" },
  { iso2: "EE", iso3: "EST", numericCode: "233", nameEn: "Estonia", nameAz: "Estoniya", region: "Europe", subRegion: "Northern Europe" },
  { iso2: "FI", iso3: "FIN", numericCode: "246", nameEn: "Finland", nameAz: "Finlandiya", region: "Europe", subRegion: "Northern Europe" },
  { iso2: "IS", iso3: "ISL", numericCode: "352", nameEn: "Iceland", nameAz: "İslandiya", region: "Europe", subRegion: "Northern Europe" },
  { iso2: "IE", iso3: "IRL", numericCode: "372", nameEn: "Ireland", nameAz: "İrlandiya", region: "Europe", subRegion: "Northern Europe" },
  { iso2: "LV", iso3: "LVA", numericCode: "428", nameEn: "Latvia", nameAz: "Latviya", region: "Europe", subRegion: "Northern Europe" },
  { iso2: "LT", iso3: "LTU", numericCode: "440", nameEn: "Lithuania", nameAz: "Litva", region: "Europe", subRegion: "Northern Europe" },
  { iso2: "NO", iso3: "NOR", numericCode: "578", nameEn: "Norway", nameAz: "Norveç", region: "Europe", subRegion: "Northern Europe" },
  { iso2: "SE", iso3: "SWE", numericCode: "752", nameEn: "Sweden", nameAz: "İsveç", region: "Europe", subRegion: "Northern Europe" },
  { iso2: "GB", iso3: "GBR", numericCode: "826", nameEn: "United Kingdom", nameAz: "Böyük Britaniya", region: "Europe", subRegion: "Northern Europe" },
  
  // Western Europe
  { iso2: "AT", iso3: "AUT", numericCode: "040", nameEn: "Austria", nameAz: "Avstriya", region: "Europe", subRegion: "Western Europe" },
  { iso2: "BE", iso3: "BEL", numericCode: "056", nameEn: "Belgium", nameAz: "Belçika", region: "Europe", subRegion: "Western Europe" },
  { iso2: "FR", iso3: "FRA", numericCode: "250", nameEn: "France", nameAz: "Fransa", region: "Europe", subRegion: "Western Europe" },
  { iso2: "DE", iso3: "DEU", numericCode: "276", nameEn: "Germany", nameAz: "Almaniya", region: "Europe", subRegion: "Western Europe" },
  { iso2: "LI", iso3: "LIE", numericCode: "438", nameEn: "Liechtenstein", nameAz: "Lixtenşteyn", region: "Europe", subRegion: "Western Europe" },
  { iso2: "LU", iso3: "LUX", numericCode: "442", nameEn: "Luxembourg", nameAz: "Lüksemburq", region: "Europe", subRegion: "Western Europe" },
  { iso2: "MC", iso3: "MCO", numericCode: "492", nameEn: "Monaco", nameAz: "Monako", region: "Europe", subRegion: "Western Europe" },
  { iso2: "NL", iso3: "NLD", numericCode: "528", nameEn: "Netherlands", nameAz: "Niderland", region: "Europe", subRegion: "Western Europe" },
  { iso2: "CH", iso3: "CHE", numericCode: "756", nameEn: "Switzerland", nameAz: "İsveçrə", region: "Europe", subRegion: "Western Europe" },
  
  // Eastern Europe
  { iso2: "BY", iso3: "BLR", numericCode: "112", nameEn: "Belarus", nameAz: "Belarus", region: "Europe", subRegion: "Eastern Europe" },
  { iso2: "BG", iso3: "BGR", numericCode: "100", nameEn: "Bulgaria", nameAz: "Bolqarıstan", region: "Europe", subRegion: "Eastern Europe" },
  { iso2: "CZ", iso3: "CZE", numericCode: "203", nameEn: "Czechia", nameAz: "Çexiya", region: "Europe", subRegion: "Eastern Europe" },
  { iso2: "HU", iso3: "HUN", numericCode: "348", nameEn: "Hungary", nameAz: "Macarıstan", region: "Europe", subRegion: "Eastern Europe" },
  { iso2: "MD", iso3: "MDA", numericCode: "498", nameEn: "Moldova", nameAz: "Moldova", region: "Europe", subRegion: "Eastern Europe" },
  { iso2: "PL", iso3: "POL", numericCode: "616", nameEn: "Poland", nameAz: "Polşa", region: "Europe", subRegion: "Eastern Europe" },
  { iso2: "RO", iso3: "ROU", numericCode: "642", nameEn: "Romania", nameAz: "Rumıniya", region: "Europe", subRegion: "Eastern Europe" },
  { iso2: "RU", iso3: "RUS", numericCode: "643", nameEn: "Russia", nameAz: "Rusiya", region: "Europe", subRegion: "Eastern Europe" },
  { iso2: "SK", iso3: "SVK", numericCode: "703", nameEn: "Slovakia", nameAz: "Slovakiya", region: "Europe", subRegion: "Eastern Europe" },
  { iso2: "UA", iso3: "UKR", numericCode: "804", nameEn: "Ukraine", nameAz: "Ukrayna", region: "Europe", subRegion: "Eastern Europe" },
  
  // Southern Europe
  { iso2: "AL", iso3: "ALB", numericCode: "008", nameEn: "Albania", nameAz: "Albaniya", region: "Europe", subRegion: "Southern Europe" },
  { iso2: "AD", iso3: "AND", numericCode: "020", nameEn: "Andorra", nameAz: "Andorra", region: "Europe", subRegion: "Southern Europe" },
  { iso2: "BA", iso3: "BIH", numericCode: "070", nameEn: "Bosnia and Herzegovina", nameAz: "Bosniya və Herseqovina", region: "Europe", subRegion: "Southern Europe" },
  { iso2: "HR", iso3: "HRV", numericCode: "191", nameEn: "Croatia", nameAz: "Xorvatiya", region: "Europe", subRegion: "Southern Europe" },
  { iso2: "GR", iso3: "GRC", numericCode: "300", nameEn: "Greece", nameAz: "Yunanıstan", region: "Europe", subRegion: "Southern Europe" },
  { iso2: "IT", iso3: "ITA", numericCode: "380", nameEn: "Italy", nameAz: "İtaliya", region: "Europe", subRegion: "Southern Europe" },
  { iso2: "MT", iso3: "MLT", numericCode: "470", nameEn: "Malta", nameAz: "Malta", region: "Europe", subRegion: "Southern Europe" },
  { iso2: "ME", iso3: "MNE", numericCode: "499", nameEn: "Montenegro", nameAz: "Monteneqro", region: "Europe", subRegion: "Southern Europe" },
  { iso2: "MK", iso3: "MKD", numericCode: "807", nameEn: "North Macedonia", nameAz: "Şimali Makedoniya", region: "Europe", subRegion: "Southern Europe" },
  { iso2: "PT", iso3: "PRT", numericCode: "620", nameEn: "Portugal", nameAz: "Portuqaliya", region: "Europe", subRegion: "Southern Europe" },
  { iso2: "SM", iso3: "SMR", numericCode: "674", nameEn: "San Marino", nameAz: "San Marino", region: "Europe", subRegion: "Southern Europe" },
  { iso2: "RS", iso3: "SRB", numericCode: "688", nameEn: "Serbia", nameAz: "Serbiya", region: "Europe", subRegion: "Southern Europe" },
  { iso2: "SI", iso3: "SVN", numericCode: "705", nameEn: "Slovenia", nameAz: "Sloveniya", region: "Europe", subRegion: "Southern Europe" },
  { iso2: "ES", iso3: "ESP", numericCode: "724", nameEn: "Spain", nameAz: "İspaniya", region: "Europe", subRegion: "Southern Europe" },
  { iso2: "VA", iso3: "VAT", numericCode: "336", nameEn: "Vatican City", nameAz: "Vatikan", region: "Europe", subRegion: "Southern Europe" },
  { iso2: "CY", iso3: "CYP", numericCode: "196", nameEn: "Cyprus", nameAz: "Kipr", region: "Europe", subRegion: "Southern Europe" },

  // ============ ASIA ============
  // Western Asia (includes South Caucasus)
  { iso2: "AM", iso3: "ARM", numericCode: "051", nameEn: "Armenia", nameAz: "Ermənistan", region: "Asia", subRegion: "Western Asia" },
  { iso2: "AZ", iso3: "AZE", numericCode: "031", nameEn: "Azerbaijan", nameAz: "Azərbaycan", region: "Asia", subRegion: "Western Asia" },
  { iso2: "BH", iso3: "BHR", numericCode: "048", nameEn: "Bahrain", nameAz: "Bəhreyn", region: "Asia", subRegion: "Western Asia" },
  { iso2: "GE", iso3: "GEO", numericCode: "268", nameEn: "Georgia", nameAz: "Gürcüstan", region: "Asia", subRegion: "Western Asia" },
  { iso2: "IQ", iso3: "IRQ", numericCode: "368", nameEn: "Iraq", nameAz: "İraq", region: "Asia", subRegion: "Western Asia" },
  { iso2: "IL", iso3: "ISR", numericCode: "376", nameEn: "Israel", nameAz: "İsrail", region: "Asia", subRegion: "Western Asia" },
  { iso2: "JO", iso3: "JOR", numericCode: "400", nameEn: "Jordan", nameAz: "İordaniya", region: "Asia", subRegion: "Western Asia" },
  { iso2: "KW", iso3: "KWT", numericCode: "414", nameEn: "Kuwait", nameAz: "Küveyt", region: "Asia", subRegion: "Western Asia" },
  { iso2: "LB", iso3: "LBN", numericCode: "422", nameEn: "Lebanon", nameAz: "Livan", region: "Asia", subRegion: "Western Asia" },
  { iso2: "OM", iso3: "OMN", numericCode: "512", nameEn: "Oman", nameAz: "Oman", region: "Asia", subRegion: "Western Asia" },
  { iso2: "PS", iso3: "PSE", numericCode: "275", nameEn: "Palestine", nameAz: "Fələstin", region: "Asia", subRegion: "Western Asia" },
  { iso2: "QA", iso3: "QAT", numericCode: "634", nameEn: "Qatar", nameAz: "Qətər", region: "Asia", subRegion: "Western Asia" },
  { iso2: "SA", iso3: "SAU", numericCode: "682", nameEn: "Saudi Arabia", nameAz: "Səudiyyə Ərəbistanı", region: "Asia", subRegion: "Western Asia" },
  { iso2: "SY", iso3: "SYR", numericCode: "760", nameEn: "Syria", nameAz: "Suriya", region: "Asia", subRegion: "Western Asia" },
  { iso2: "TR", iso3: "TUR", numericCode: "792", nameEn: "Turkey", nameAz: "Türkiyə", region: "Asia", subRegion: "Western Asia" },
  { iso2: "AE", iso3: "ARE", numericCode: "784", nameEn: "United Arab Emirates", nameAz: "Birləşmiş Ərəb Əmirlikləri", region: "Asia", subRegion: "Western Asia" },
  { iso2: "YE", iso3: "YEM", numericCode: "887", nameEn: "Yemen", nameAz: "Yəmən", region: "Asia", subRegion: "Western Asia" },
  { iso2: "IR", iso3: "IRN", numericCode: "364", nameEn: "Iran", nameAz: "İran", region: "Asia", subRegion: "Western Asia" },

  // Central Asia
  { iso2: "KZ", iso3: "KAZ", numericCode: "398", nameEn: "Kazakhstan", nameAz: "Qazaxıstan", region: "Asia", subRegion: "Central Asia" },
  { iso2: "KG", iso3: "KGZ", numericCode: "417", nameEn: "Kyrgyzstan", nameAz: "Qırğızıstan", region: "Asia", subRegion: "Central Asia" },
  { iso2: "TJ", iso3: "TJK", numericCode: "762", nameEn: "Tajikistan", nameAz: "Tacikistan", region: "Asia", subRegion: "Central Asia" },
  { iso2: "TM", iso3: "TKM", numericCode: "795", nameEn: "Turkmenistan", nameAz: "Türkmənistan", region: "Asia", subRegion: "Central Asia" },
  { iso2: "UZ", iso3: "UZB", numericCode: "860", nameEn: "Uzbekistan", nameAz: "Özbəkistan", region: "Asia", subRegion: "Central Asia" },

  // Southern Asia
  { iso2: "AF", iso3: "AFG", numericCode: "004", nameEn: "Afghanistan", nameAz: "Əfqanıstan", region: "Asia", subRegion: "Southern Asia" },
  { iso2: "BD", iso3: "BGD", numericCode: "050", nameEn: "Bangladesh", nameAz: "Banqladeş", region: "Asia", subRegion: "Southern Asia" },
  { iso2: "BT", iso3: "BTN", numericCode: "064", nameEn: "Bhutan", nameAz: "Butan", region: "Asia", subRegion: "Southern Asia" },
  { iso2: "IN", iso3: "IND", numericCode: "356", nameEn: "India", nameAz: "Hindistan", region: "Asia", subRegion: "Southern Asia" },
  { iso2: "MV", iso3: "MDV", numericCode: "462", nameEn: "Maldives", nameAz: "Maldiv adaları", region: "Asia", subRegion: "Southern Asia" },
  { iso2: "NP", iso3: "NPL", numericCode: "524", nameEn: "Nepal", nameAz: "Nepal", region: "Asia", subRegion: "Southern Asia" },
  { iso2: "PK", iso3: "PAK", numericCode: "586", nameEn: "Pakistan", nameAz: "Pakistan", region: "Asia", subRegion: "Southern Asia" },
  { iso2: "LK", iso3: "LKA", numericCode: "144", nameEn: "Sri Lanka", nameAz: "Şri-Lanka", region: "Asia", subRegion: "Southern Asia" },

  // Eastern Asia
  { iso2: "CN", iso3: "CHN", numericCode: "156", nameEn: "China", nameAz: "Çin", region: "Asia", subRegion: "Eastern Asia" },
  { iso2: "JP", iso3: "JPN", numericCode: "392", nameEn: "Japan", nameAz: "Yaponiya", region: "Asia", subRegion: "Eastern Asia" },
  { iso2: "KP", iso3: "PRK", numericCode: "408", nameEn: "North Korea", nameAz: "Şimali Koreya", region: "Asia", subRegion: "Eastern Asia" },
  { iso2: "KR", iso3: "KOR", numericCode: "410", nameEn: "South Korea", nameAz: "Cənubi Koreya", region: "Asia", subRegion: "Eastern Asia" },
  { iso2: "MN", iso3: "MNG", numericCode: "496", nameEn: "Mongolia", nameAz: "Monqolustan", region: "Asia", subRegion: "Eastern Asia" },
  { iso2: "TW", iso3: "TWN", numericCode: "158", nameEn: "Taiwan", nameAz: "Tayvan", region: "Asia", subRegion: "Eastern Asia" },
  { iso2: "HK", iso3: "HKG", numericCode: "344", nameEn: "Hong Kong", nameAz: "Honq Konq", region: "Asia", subRegion: "Eastern Asia" },
  { iso2: "MO", iso3: "MAC", numericCode: "446", nameEn: "Macau", nameAz: "Makao", region: "Asia", subRegion: "Eastern Asia" },

  // South-Eastern Asia
  { iso2: "BN", iso3: "BRN", numericCode: "096", nameEn: "Brunei", nameAz: "Bruney", region: "Asia", subRegion: "South-Eastern Asia" },
  { iso2: "KH", iso3: "KHM", numericCode: "116", nameEn: "Cambodia", nameAz: "Kamboca", region: "Asia", subRegion: "South-Eastern Asia" },
  { iso2: "ID", iso3: "IDN", numericCode: "360", nameEn: "Indonesia", nameAz: "İndoneziya", region: "Asia", subRegion: "South-Eastern Asia" },
  { iso2: "LA", iso3: "LAO", numericCode: "418", nameEn: "Laos", nameAz: "Laos", region: "Asia", subRegion: "South-Eastern Asia" },
  { iso2: "MY", iso3: "MYS", numericCode: "458", nameEn: "Malaysia", nameAz: "Malayziya", region: "Asia", subRegion: "South-Eastern Asia" },
  { iso2: "MM", iso3: "MMR", numericCode: "104", nameEn: "Myanmar", nameAz: "Myanma", region: "Asia", subRegion: "South-Eastern Asia" },
  { iso2: "PH", iso3: "PHL", numericCode: "608", nameEn: "Philippines", nameAz: "Filippin", region: "Asia", subRegion: "South-Eastern Asia" },
  { iso2: "SG", iso3: "SGP", numericCode: "702", nameEn: "Singapore", nameAz: "Sinqapur", region: "Asia", subRegion: "South-Eastern Asia" },
  { iso2: "TH", iso3: "THA", numericCode: "764", nameEn: "Thailand", nameAz: "Tayland", region: "Asia", subRegion: "South-Eastern Asia" },
  { iso2: "TL", iso3: "TLS", numericCode: "626", nameEn: "Timor-Leste", nameAz: "Şərqi Timor", region: "Asia", subRegion: "South-Eastern Asia" },
  { iso2: "VN", iso3: "VNM", numericCode: "704", nameEn: "Vietnam", nameAz: "Vyetnam", region: "Asia", subRegion: "South-Eastern Asia" },

  // ============ AFRICA ============
  // Northern Africa
  { iso2: "DZ", iso3: "DZA", numericCode: "012", nameEn: "Algeria", nameAz: "Əlcəzair", region: "Africa", subRegion: "Northern Africa" },
  { iso2: "EG", iso3: "EGY", numericCode: "818", nameEn: "Egypt", nameAz: "Misir", region: "Africa", subRegion: "Northern Africa" },
  { iso2: "LY", iso3: "LBY", numericCode: "434", nameEn: "Libya", nameAz: "Liviya", region: "Africa", subRegion: "Northern Africa" },
  { iso2: "MA", iso3: "MAR", numericCode: "504", nameEn: "Morocco", nameAz: "Mərakeş", region: "Africa", subRegion: "Northern Africa" },
  { iso2: "SD", iso3: "SDN", numericCode: "729", nameEn: "Sudan", nameAz: "Sudan", region: "Africa", subRegion: "Northern Africa" },
  { iso2: "TN", iso3: "TUN", numericCode: "788", nameEn: "Tunisia", nameAz: "Tunis", region: "Africa", subRegion: "Northern Africa" },

  // Western Africa
  { iso2: "BJ", iso3: "BEN", numericCode: "204", nameEn: "Benin", nameAz: "Benin", region: "Africa", subRegion: "Western Africa" },
  { iso2: "BF", iso3: "BFA", numericCode: "854", nameEn: "Burkina Faso", nameAz: "Burkina Faso", region: "Africa", subRegion: "Western Africa" },
  { iso2: "CV", iso3: "CPV", numericCode: "132", nameEn: "Cabo Verde", nameAz: "Kabo Verde", region: "Africa", subRegion: "Western Africa" },
  { iso2: "CI", iso3: "CIV", numericCode: "384", nameEn: "Côte d'Ivoire", nameAz: "Kot d'İvuar", region: "Africa", subRegion: "Western Africa" },
  { iso2: "GM", iso3: "GMB", numericCode: "270", nameEn: "Gambia", nameAz: "Qambiya", region: "Africa", subRegion: "Western Africa" },
  { iso2: "GH", iso3: "GHA", numericCode: "288", nameEn: "Ghana", nameAz: "Qana", region: "Africa", subRegion: "Western Africa" },
  { iso2: "GN", iso3: "GIN", numericCode: "324", nameEn: "Guinea", nameAz: "Qvineya", region: "Africa", subRegion: "Western Africa" },
  { iso2: "GW", iso3: "GNB", numericCode: "624", nameEn: "Guinea-Bissau", nameAz: "Qvineya-Bisau", region: "Africa", subRegion: "Western Africa" },
  { iso2: "LR", iso3: "LBR", numericCode: "430", nameEn: "Liberia", nameAz: "Liberiya", region: "Africa", subRegion: "Western Africa" },
  { iso2: "ML", iso3: "MLI", numericCode: "466", nameEn: "Mali", nameAz: "Mali", region: "Africa", subRegion: "Western Africa" },
  { iso2: "MR", iso3: "MRT", numericCode: "478", nameEn: "Mauritania", nameAz: "Mavritaniya", region: "Africa", subRegion: "Western Africa" },
  { iso2: "NE", iso3: "NER", numericCode: "562", nameEn: "Niger", nameAz: "Niger", region: "Africa", subRegion: "Western Africa" },
  { iso2: "NG", iso3: "NGA", numericCode: "566", nameEn: "Nigeria", nameAz: "Nigeriya", region: "Africa", subRegion: "Western Africa" },
  { iso2: "SN", iso3: "SEN", numericCode: "686", nameEn: "Senegal", nameAz: "Seneqal", region: "Africa", subRegion: "Western Africa" },
  { iso2: "SL", iso3: "SLE", numericCode: "694", nameEn: "Sierra Leone", nameAz: "Syerra Leone", region: "Africa", subRegion: "Western Africa" },
  { iso2: "TG", iso3: "TGO", numericCode: "768", nameEn: "Togo", nameAz: "Toqo", region: "Africa", subRegion: "Western Africa" },

  // Eastern Africa
  { iso2: "BI", iso3: "BDI", numericCode: "108", nameEn: "Burundi", nameAz: "Burundi", region: "Africa", subRegion: "Eastern Africa" },
  { iso2: "KM", iso3: "COM", numericCode: "174", nameEn: "Comoros", nameAz: "Komor adaları", region: "Africa", subRegion: "Eastern Africa" },
  { iso2: "DJ", iso3: "DJI", numericCode: "262", nameEn: "Djibouti", nameAz: "Cibuti", region: "Africa", subRegion: "Eastern Africa" },
  { iso2: "ER", iso3: "ERI", numericCode: "232", nameEn: "Eritrea", nameAz: "Eritreya", region: "Africa", subRegion: "Eastern Africa" },
  { iso2: "ET", iso3: "ETH", numericCode: "231", nameEn: "Ethiopia", nameAz: "Efiopiya", region: "Africa", subRegion: "Eastern Africa" },
  { iso2: "KE", iso3: "KEN", numericCode: "404", nameEn: "Kenya", nameAz: "Keniya", region: "Africa", subRegion: "Eastern Africa" },
  { iso2: "MG", iso3: "MDG", numericCode: "450", nameEn: "Madagascar", nameAz: "Madaqaskar", region: "Africa", subRegion: "Eastern Africa" },
  { iso2: "MW", iso3: "MWI", numericCode: "454", nameEn: "Malawi", nameAz: "Malavi", region: "Africa", subRegion: "Eastern Africa" },
  { iso2: "MU", iso3: "MUS", numericCode: "480", nameEn: "Mauritius", nameAz: "Mavriki", region: "Africa", subRegion: "Eastern Africa" },
  { iso2: "MZ", iso3: "MOZ", numericCode: "508", nameEn: "Mozambique", nameAz: "Mozambik", region: "Africa", subRegion: "Eastern Africa" },
  { iso2: "RW", iso3: "RWA", numericCode: "646", nameEn: "Rwanda", nameAz: "Ruanda", region: "Africa", subRegion: "Eastern Africa" },
  { iso2: "SC", iso3: "SYC", numericCode: "690", nameEn: "Seychelles", nameAz: "Seyşel adaları", region: "Africa", subRegion: "Eastern Africa" },
  { iso2: "SO", iso3: "SOM", numericCode: "706", nameEn: "Somalia", nameAz: "Somali", region: "Africa", subRegion: "Eastern Africa" },
  { iso2: "SS", iso3: "SSD", numericCode: "728", nameEn: "South Sudan", nameAz: "Cənubi Sudan", region: "Africa", subRegion: "Eastern Africa" },
  { iso2: "TZ", iso3: "TZA", numericCode: "834", nameEn: "Tanzania", nameAz: "Tanzaniya", region: "Africa", subRegion: "Eastern Africa" },
  { iso2: "UG", iso3: "UGA", numericCode: "800", nameEn: "Uganda", nameAz: "Uqanda", region: "Africa", subRegion: "Eastern Africa" },
  { iso2: "ZM", iso3: "ZMB", numericCode: "894", nameEn: "Zambia", nameAz: "Zambiya", region: "Africa", subRegion: "Eastern Africa" },
  { iso2: "ZW", iso3: "ZWE", numericCode: "716", nameEn: "Zimbabwe", nameAz: "Zimbabve", region: "Africa", subRegion: "Eastern Africa" },

  // Middle Africa
  { iso2: "AO", iso3: "AGO", numericCode: "024", nameEn: "Angola", nameAz: "Anqola", region: "Africa", subRegion: "Middle Africa" },
  { iso2: "CM", iso3: "CMR", numericCode: "120", nameEn: "Cameroon", nameAz: "Kamerun", region: "Africa", subRegion: "Middle Africa" },
  { iso2: "CF", iso3: "CAF", numericCode: "140", nameEn: "Central African Republic", nameAz: "Mərkəzi Afrika Respublikası", region: "Africa", subRegion: "Middle Africa" },
  { iso2: "TD", iso3: "TCD", numericCode: "148", nameEn: "Chad", nameAz: "Çad", region: "Africa", subRegion: "Middle Africa" },
  { iso2: "CG", iso3: "COG", numericCode: "178", nameEn: "Congo", nameAz: "Konqo", region: "Africa", subRegion: "Middle Africa" },
  { iso2: "CD", iso3: "COD", numericCode: "180", nameEn: "DR Congo", nameAz: "Kongo DR", region: "Africa", subRegion: "Middle Africa" },
  { iso2: "GQ", iso3: "GNQ", numericCode: "226", nameEn: "Equatorial Guinea", nameAz: "Ekvatorial Qvineya", region: "Africa", subRegion: "Middle Africa" },
  { iso2: "GA", iso3: "GAB", numericCode: "266", nameEn: "Gabon", nameAz: "Qabon", region: "Africa", subRegion: "Middle Africa" },
  { iso2: "ST", iso3: "STP", numericCode: "678", nameEn: "São Tomé and Príncipe", nameAz: "San Tome və Prinsipi", region: "Africa", subRegion: "Middle Africa" },

  // Southern Africa
  { iso2: "BW", iso3: "BWA", numericCode: "072", nameEn: "Botswana", nameAz: "Botsvana", region: "Africa", subRegion: "Southern Africa" },
  { iso2: "SZ", iso3: "SWZ", numericCode: "748", nameEn: "Eswatini", nameAz: "Esvatini", region: "Africa", subRegion: "Southern Africa" },
  { iso2: "LS", iso3: "LSO", numericCode: "426", nameEn: "Lesotho", nameAz: "Lesoto", region: "Africa", subRegion: "Southern Africa" },
  { iso2: "NA", iso3: "NAM", numericCode: "516", nameEn: "Namibia", nameAz: "Namibiya", region: "Africa", subRegion: "Southern Africa" },
  { iso2: "ZA", iso3: "ZAF", numericCode: "710", nameEn: "South Africa", nameAz: "Cənubi Afrika", region: "Africa", subRegion: "Southern Africa" },

  // ============ AMERICAS ============
  // Northern America
  { iso2: "CA", iso3: "CAN", numericCode: "124", nameEn: "Canada", nameAz: "Kanada", region: "Americas", subRegion: "Northern America" },
  { iso2: "US", iso3: "USA", numericCode: "840", nameEn: "United States", nameAz: "Amerika Birləşmiş Ştatları", region: "Americas", subRegion: "Northern America" },
  { iso2: "MX", iso3: "MEX", numericCode: "484", nameEn: "Mexico", nameAz: "Meksika", region: "Americas", subRegion: "Northern America" },

  // Central America
  { iso2: "BZ", iso3: "BLZ", numericCode: "084", nameEn: "Belize", nameAz: "Beliz", region: "Americas", subRegion: "Central America" },
  { iso2: "CR", iso3: "CRI", numericCode: "188", nameEn: "Costa Rica", nameAz: "Kosta Rika", region: "Americas", subRegion: "Central America" },
  { iso2: "SV", iso3: "SLV", numericCode: "222", nameEn: "El Salvador", nameAz: "Salvador", region: "Americas", subRegion: "Central America" },
  { iso2: "GT", iso3: "GTM", numericCode: "320", nameEn: "Guatemala", nameAz: "Qvatemala", region: "Americas", subRegion: "Central America" },
  { iso2: "HN", iso3: "HND", numericCode: "340", nameEn: "Honduras", nameAz: "Honduras", region: "Americas", subRegion: "Central America" },
  { iso2: "NI", iso3: "NIC", numericCode: "558", nameEn: "Nicaragua", nameAz: "Nikaraqua", region: "Americas", subRegion: "Central America" },
  { iso2: "PA", iso3: "PAN", numericCode: "591", nameEn: "Panama", nameAz: "Panama", region: "Americas", subRegion: "Central America" },

  // Caribbean
  { iso2: "CU", iso3: "CUB", numericCode: "192", nameEn: "Cuba", nameAz: "Kuba", region: "Americas", subRegion: "Caribbean" },
  { iso2: "DO", iso3: "DOM", numericCode: "214", nameEn: "Dominican Republic", nameAz: "Dominikan Respublikası", region: "Americas", subRegion: "Caribbean" },
  { iso2: "HT", iso3: "HTI", numericCode: "332", nameEn: "Haiti", nameAz: "Haiti", region: "Americas", subRegion: "Caribbean" },
  { iso2: "JM", iso3: "JAM", numericCode: "388", nameEn: "Jamaica", nameAz: "Yamayka", region: "Americas", subRegion: "Caribbean" },
  { iso2: "PR", iso3: "PRI", numericCode: "630", nameEn: "Puerto Rico", nameAz: "Puerto Riko", region: "Americas", subRegion: "Caribbean" },
  { iso2: "TT", iso3: "TTO", numericCode: "780", nameEn: "Trinidad and Tobago", nameAz: "Trinidad və Tobaqo", region: "Americas", subRegion: "Caribbean" },

  // South America
  { iso2: "AR", iso3: "ARG", numericCode: "032", nameEn: "Argentina", nameAz: "Argentina", region: "Americas", subRegion: "South America" },
  { iso2: "BO", iso3: "BOL", numericCode: "068", nameEn: "Bolivia", nameAz: "Boliviya", region: "Americas", subRegion: "South America" },
  { iso2: "BR", iso3: "BRA", numericCode: "076", nameEn: "Brazil", nameAz: "Braziliya", region: "Americas", subRegion: "South America" },
  { iso2: "CL", iso3: "CHL", numericCode: "152", nameEn: "Chile", nameAz: "Çili", region: "Americas", subRegion: "South America" },
  { iso2: "CO", iso3: "COL", numericCode: "170", nameEn: "Colombia", nameAz: "Kolumbiya", region: "Americas", subRegion: "South America" },
  { iso2: "EC", iso3: "ECU", numericCode: "218", nameEn: "Ecuador", nameAz: "Ekvador", region: "Americas", subRegion: "South America" },
  { iso2: "GY", iso3: "GUY", numericCode: "328", nameEn: "Guyana", nameAz: "Qayana", region: "Americas", subRegion: "South America" },
  { iso2: "PY", iso3: "PRY", numericCode: "600", nameEn: "Paraguay", nameAz: "Paraqvay", region: "Americas", subRegion: "South America" },
  { iso2: "PE", iso3: "PER", numericCode: "604", nameEn: "Peru", nameAz: "Peru", region: "Americas", subRegion: "South America" },
  { iso2: "SR", iso3: "SUR", numericCode: "740", nameEn: "Suriname", nameAz: "Surinam", region: "Americas", subRegion: "South America" },
  { iso2: "UY", iso3: "URY", numericCode: "858", nameEn: "Uruguay", nameAz: "Uruqvay", region: "Americas", subRegion: "South America" },
  { iso2: "VE", iso3: "VEN", numericCode: "862", nameEn: "Venezuela", nameAz: "Venesuela", region: "Americas", subRegion: "South America" },

  // ============ OCEANIA ============
  // Australia and New Zealand
  { iso2: "AU", iso3: "AUS", numericCode: "036", nameEn: "Australia", nameAz: "Avstraliya", region: "Oceania", subRegion: "Australia and New Zealand" },
  { iso2: "NZ", iso3: "NZL", numericCode: "554", nameEn: "New Zealand", nameAz: "Yeni Zelandiya", region: "Oceania", subRegion: "Australia and New Zealand" },

  // Melanesia
  { iso2: "FJ", iso3: "FJI", numericCode: "242", nameEn: "Fiji", nameAz: "Fici", region: "Oceania", subRegion: "Melanesia" },
  { iso2: "PG", iso3: "PNG", numericCode: "598", nameEn: "Papua New Guinea", nameAz: "Papua Yeni Qvineya", region: "Oceania", subRegion: "Melanesia" },
  { iso2: "SB", iso3: "SLB", numericCode: "090", nameEn: "Solomon Islands", nameAz: "Solomon adaları", region: "Oceania", subRegion: "Melanesia" },
  { iso2: "VU", iso3: "VUT", numericCode: "548", nameEn: "Vanuatu", nameAz: "Vanuatu", region: "Oceania", subRegion: "Melanesia" },

  // Polynesia
  { iso2: "WS", iso3: "WSM", numericCode: "882", nameEn: "Samoa", nameAz: "Samoa", region: "Oceania", subRegion: "Polynesia" },
  { iso2: "TO", iso3: "TON", numericCode: "776", nameEn: "Tonga", nameAz: "Tonqa", region: "Oceania", subRegion: "Polynesia" },
  { iso2: "TV", iso3: "TUV", numericCode: "798", nameEn: "Tuvalu", nameAz: "Tuvalu", region: "Oceania", subRegion: "Polynesia" },
];

// Generate flag emoji from ISO2 code
function getFlagEmoji(iso2: string): string {
  const codePoints = iso2
    .toUpperCase()
    .split("")
    .map((char) => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

async function seedGlobalCountries() {
  console.log("🌍 Seeding Global Countries...\n");

  let created = 0;
  let existing = 0;

  for (const country of countries) {
    const existingCountry = await prisma.globalCountry.findUnique({
      where: { iso2: country.iso2 },
    });

    if (existingCountry) {
      existing++;
      continue;
    }

    await prisma.globalCountry.create({
      data: {
        iso2: country.iso2,
        iso3: country.iso3,
        numericCode: country.numericCode,
        nameEn: country.nameEn,
        nameAz: country.nameAz,
        region: country.region,
        subRegion: country.subRegion,
        flagEmoji: getFlagEmoji(country.iso2),
        isFeatured: country.iso2 === "AZ", // Azerbaijan is featured
        isActive: true,
      },
    });
    created++;
  }

  console.log(`✅ Created ${created} GlobalCountries`);
  console.log(`ℹ️  ${existing} already existed\n`);

  // Now link existing source countries to GlobalCountry
  await linkSourceCountries();
}

async function linkSourceCountries() {
  console.log("🔗 Linking source countries to GlobalCountry...\n");

  // Link AZ Country
  const azCountry = await prisma.country.findFirst({ where: { iso2: "AZ" } });
  if (azCountry) {
    const globalAZ = await prisma.globalCountry.findUnique({ where: { iso2: "AZ" } });
    if (globalAZ) {
      await prisma.country.update({
        where: { id: azCountry.id },
        data: { globalCountryId: globalAZ.id },
      });
      console.log("  ✅ Linked AZ Country → GlobalCountry");
    }
  }

  // Link EU Countries
  const euCountries = await prisma.euCountry.findMany();
  let euLinked = 0;
  for (const euCountry of euCountries) {
    // EU uses 2-letter codes, some special cases
    let iso2 = euCountry.code;
    if (iso2 === "EL") iso2 = "GR"; // Greece
    if (iso2 === "UK") iso2 = "GB"; // UK

    const globalCountry = await prisma.globalCountry.findUnique({ where: { iso2 } });
    if (globalCountry) {
      await prisma.euCountry.update({
        where: { id: euCountry.id },
        data: { globalCountryId: globalCountry.id },
      });
      euLinked++;
    }
  }
  console.log(`  ✅ Linked ${euLinked}/${euCountries.length} EU Countries`);

  // Link FAO Countries
  const faoCountries = await prisma.faoCountry.findMany();
  let faoLinked = 0;
  for (const faoCountry of faoCountries) {
    // Try ISO2 first, then ISO3
    let globalCountry = null;
    if (faoCountry.iso2) {
      globalCountry = await prisma.globalCountry.findUnique({ where: { iso2: faoCountry.iso2 } });
    }
    if (!globalCountry && faoCountry.iso3) {
      globalCountry = await prisma.globalCountry.findUnique({ where: { iso3: faoCountry.iso3 } });
    }

    if (globalCountry) {
      await prisma.faoCountry.update({
        where: { id: faoCountry.id },
        data: { globalCountryId: globalCountry.id },
      });
      faoLinked++;
    }
  }
  console.log(`  ✅ Linked ${faoLinked}/${faoCountries.length} FAO Countries`);

  // Link FPMA Countries
  const fpmaCountries = await prisma.fpmaCountry.findMany();
  let fpmaLinked = 0;
  for (const fpmaCountry of fpmaCountries) {
    // FPMA uses ISO3
    const globalCountry = await prisma.globalCountry.findUnique({ where: { iso3: fpmaCountry.iso3 } });
    if (globalCountry) {
      await prisma.fpmaCountry.update({
        where: { id: fpmaCountry.id },
        data: { globalCountryId: globalCountry.id },
      });
      fpmaLinked++;

      // Also fix the iso2 if it's wrong
      if (!fpmaCountry.iso2 || fpmaCountry.iso2 !== globalCountry.iso2) {
        await prisma.fpmaCountry.update({
          where: { id: fpmaCountry.id },
          data: { iso2: globalCountry.iso2 },
        });
      }
    }
  }
  console.log(`  ✅ Linked ${fpmaLinked}/${fpmaCountries.length} FPMA Countries`);
}

async function main() {
  try {
    await seedGlobalCountries();
    console.log("\n🎉 Global Countries seeding completed!");
  } catch (error) {
    console.error("Error seeding global countries:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main();


