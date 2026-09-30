'use client';

import { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, Check } from 'lucide-react';

interface Country {
  code: string;
  name: string;
  flag: string;
}

const COUNTRIES: Country[] = [
  { code: 'AF', name: 'Afghanistan', flag: '🇦🇫' },
  { code: 'ZA', name: 'Afrique du Sud', flag: '🇿🇦' },
  { code: 'AL', name: 'Albanie', flag: '🇦🇱' },
  { code: 'DZ', name: 'Algérie', flag: '🇩🇿' },
  { code: 'DE', name: 'Allemagne', flag: '🇩🇪' },
  { code: 'AD', name: 'Andorre', flag: '🇦🇩' },
  { code: 'AO', name: 'Angola', flag: '🇦🇴' },
  { code: 'AI', name: 'Anguilla', flag: '🇦🇮' },
  { code: 'AQ', name: 'Antarctique', flag: '🇦🇶' },
  { code: 'AG', name: 'Antigua-et-Barbuda', flag: '🇦🇬' },
  { code: 'SA', name: 'Arabie Saoudite', flag: '🇸🇦' },
  { code: 'AR', name: 'Argentine', flag: '🇦🇷' },
  { code: 'AM', name: 'Arménie', flag: '🇦🇲' },
  { code: 'AW', name: 'Aruba', flag: '🇦🇼' },
  { code: 'AU', name: 'Australie', flag: '🇦🇺' },
  { code: 'AT', name: 'Autriche', flag: '🇦🇹' },
  { code: 'AZ', name: 'Azerbaïdjan', flag: '🇦🇿' },
  { code: 'BS', name: 'Bahamas', flag: '🇧🇸' },
  { code: 'BH', name: 'Bahreïn', flag: '🇧🇭' },
  { code: 'BD', name: 'Bangladesh', flag: '🇧🇩' },
  { code: 'BB', name: 'Barbade', flag: '🇧🇧' },
  { code: 'BE', name: 'Belgique', flag: '🇧🇪' },
  { code: 'BZ', name: 'Belize', flag: '🇧🇿' },
  { code: 'BJ', name: 'Bénin', flag: '🇧🇯' },
  { code: 'BM', name: 'Bermudes', flag: '🇧🇲' },
  { code: 'BT', name: 'Bhoutan', flag: '🇧🇹' },
  { code: 'BY', name: 'Biélorussie', flag: '🇧🇾' },
  { code: 'BO', name: 'Bolivie', flag: '🇧🇴' },
  { code: 'BA', name: 'Bosnie-Herzégovine', flag: '🇧🇦' },
  { code: 'BW', name: 'Botswana', flag: '🇧🇼' },
  { code: 'BR', name: 'Brésil', flag: '🇧🇷' },
  { code: 'BN', name: 'Brunei', flag: '🇧🇳' },
  { code: 'BG', name: 'Bulgarie', flag: '🇧🇬' },
  { code: 'BF', name: 'Burkina Faso', flag: '🇧🇫' },
  { code: 'BI', name: 'Burundi', flag: '🇧🇮' },
  { code: 'KH', name: 'Cambodge', flag: '🇰🇭' },
  { code: 'CM', name: 'Cameroun', flag: '🇨🇲' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦' },
  { code: 'CV', name: 'Cap-Vert', flag: '🇨🇻' },
  { code: 'CL', name: 'Chili', flag: '🇨🇱' },
  { code: 'CN', name: 'Chine', flag: '🇨🇳' },
  { code: 'CY', name: 'Chypre', flag: '🇨🇾' },
  { code: 'CO', name: 'Colombie', flag: '🇨🇴' },
  { code: 'KM', name: 'Comores', flag: '🇰🇲' },
  { code: 'CG', name: 'Congo-Brazzaville', flag: '🇨🇬' },
  { code: 'CD', name: 'Congo-Kinshasa (RDC)', flag: '🇨🇩' },
  { code: 'KP', name: 'Corée du Nord', flag: '🇰🇵' },
  { code: 'KR', name: 'Corée du Sud', flag: '🇰🇷' },
  { code: 'CR', name: 'Costa Rica', flag: '🇨🇷' },
  { code: 'CI', name: 'Côte d\'Ivoire', flag: '🇨🇮' },
  { code: 'HR', name: 'Croatie', flag: '🇭🇷' },
  { code: 'CU', name: 'Cuba', flag: '🇨🇺' },
  { code: 'CW', name: 'Curaçao', flag: '🇨🇼' },
  { code: 'DK', name: 'Danemark', flag: '🇩🇰' },
  { code: 'DJ', name: 'Djibouti', flag: '🇩🇯' },
  { code: 'DM', name: 'Dominique', flag: '🇩🇲' },
  { code: 'EG', name: 'Égypte', flag: '🇪🇬' },
  { code: 'AE', name: 'Émirats Arabes Unis', flag: '🇦🇪' },
  { code: 'EC', name: 'Équateur', flag: '🇪🇨' },
  { code: 'ER', name: 'Érythrée', flag: '🇪🇷' },
  { code: 'ES', name: 'Espagne', flag: '🇪🇸' },
  { code: 'EE', name: 'Estonie', flag: '🇪🇪' },
  { code: 'SZ', name: 'Eswatini', flag: '🇸🇿' },
  { code: 'US', name: 'États-Unis', flag: '🇺🇸' },
  { code: 'ET', name: 'Éthiopie', flag: '🇪🇹' },
  { code: 'FJ', name: 'Fidji', flag: '🇫🇯' },
  { code: 'FI', name: 'Finlande', flag: '🇫🇮' },
  { code: 'FR', name: 'France', flag: '🇫🇷' },
  { code: 'GA', name: 'Gabon', flag: '🇬🇦' },
  { code: 'GM', name: 'Gambie', flag: '🇬🇲' },
  { code: 'GE', name: 'Géorgie', flag: '🇬🇪' },
  { code: 'GH', name: 'Ghana', flag: '🇬🇭' },
  { code: 'GI', name: 'Gibraltar', flag: '🇬🇮' },
  { code: 'GR', name: 'Grèce', flag: '🇬🇷' },
  { code: 'GD', name: 'Grenade', flag: '🇬🇩' },
  { code: 'GL', name: 'Groenland', flag: '🇬🇱' },
  { code: 'GP', name: 'Guadeloupe', flag: '🇬🇵' },
  { code: 'GU', name: 'Guam', flag: '🇬🇺' },
  { code: 'GT', name: 'Guatemala', flag: '🇬🇹' },
  { code: 'GG', name: 'Guernesey', flag: '🇬🇬' },
  { code: 'GN', name: 'Guinée', flag: '🇬🇳' },
  { code: 'GQ', name: 'Guinée Équatoriale', flag: '🇬🇶' },
  { code: 'GW', name: 'Guinée-Bissau', flag: '🇬🇼' },
  { code: 'GY', name: 'Guyana', flag: '🇬🇾' },
  { code: 'GF', name: 'Guyane Française', flag: '🇬🇫' },
  { code: 'HT', name: 'Haïti', flag: '🇭🇹' },
  { code: 'HN', name: 'Honduras', flag: '🇭🇳' },
  { code: 'HK', name: 'Hong Kong', flag: '🇭🇰' },
  { code: 'HU', name: 'Hongrie', flag: '🇭🇺' },
  { code: 'IN', name: 'Inde', flag: '🇮🇳' },
  { code: 'ID', name: 'Indonésie', flag: '🇮🇩' },
  { code: 'IQ', name: 'Irak', flag: '🇮🇶' },
  { code: 'IR', name: 'Iran', flag: '🇮🇷' },
  { code: 'IE', name: 'Irlande', flag: '🇮🇪' },
  { code: 'IS', name: 'Islande', flag: '🇮🇸' },
  { code: 'IL', name: 'Israël', flag: '🇮🇱' },
  { code: 'IT', name: 'Italie', flag: '🇮🇹' },
  { code: 'JM', name: 'Jamaïque', flag: '🇯🇲' },
  { code: 'JP', name: 'Japon', flag: '🇯🇵' },
  { code: 'JE', name: 'Jersey', flag: '🇯🇪' },
  { code: 'JO', name: 'Jordanie', flag: '🇯🇴' },
  { code: 'KZ', name: 'Kazakhstan', flag: '🇰🇿' },
  { code: 'KE', name: 'Kenya', flag: '🇰🇪' },
  { code: 'KG', name: 'Kirghizistan', flag: '🇰🇬' },
  { code: 'KI', name: 'Kiribati', flag: '🇰🇮' },
  { code: 'XK', name: 'Kosovo', flag: '🇽🇰' },
  { code: 'KW', name: 'Koweït', flag: '🇰🇼' },
  { code: 'LA', name: 'Laos', flag: '🇱🇦' },
  { code: 'LS', name: 'Lesotho', flag: '🇱🇸' },
  { code: 'LV', name: 'Lettonie', flag: '🇱🇻' },
  { code: 'LB', name: 'Liban', flag: '🇱🇧' },
  { code: 'LR', name: 'Liberia', flag: '🇱🇷' },
  { code: 'LY', name: 'Libye', flag: '🇱🇾' },
  { code: 'LI', name: 'Liechtenstein', flag: '🇱🇮' },
  { code: 'LT', name: 'Lituanie', flag: '🇱🇹' },
  { code: 'LU', name: 'Luxembourg', flag: '🇱🇺' },
  { code: 'MO', name: 'Macao', flag: '🇲🇴' },
  { code: 'MK', name: 'Macédoine du Nord', flag: '🇲🇰' },
  { code: 'MG', name: 'Madagascar', flag: '🇲🇬' },
  { code: 'MY', name: 'Malaisie', flag: '🇲🇾' },
  { code: 'MW', name: 'Malawi', flag: '🇲🇼' },
  { code: 'MV', name: 'Maldives', flag: '🇲🇻' },
  { code: 'ML', name: 'Mali', flag: '🇲🇱' },
  { code: 'MT', name: 'Malte', flag: '🇲🇹' },
  { code: 'MA', name: 'Maroc', flag: '🇲🇦' },
  { code: 'MH', name: 'Marshall', flag: '🇲🇭' },
  { code: 'MQ', name: 'Martinique', flag: '🇲🇶' },
  { code: 'MU', name: 'Maurice', flag: '🇲🇺' },
  { code: 'MR', name: 'Mauritanie', flag: '🇲🇷' },
  { code: 'YT', name: 'Mayotte', flag: '🇾🇹' },
  { code: 'MX', name: 'Mexique', flag: '🇲🇽' },
  { code: 'FM', name: 'Micronésie', flag: '🇫🇲' },
  { code: 'MD', name: 'Moldavie', flag: '🇲🇩' },
  { code: 'MC', name: 'Monaco', flag: '🇲🇨' },
  { code: 'MN', name: 'Mongolie', flag: '🇲🇳' },
  { code: 'ME', name: 'Monténégro', flag: '🇲🇪' },
  { code: 'MS', name: 'Montserrat', flag: '🇲🇸' },
  { code: 'MZ', name: 'Mozambique', flag: '🇲🇿' },
  { code: 'MM', name: 'Myanmar', flag: '🇲🇲' },
  { code: 'NA', name: 'Namibie', flag: '🇳🇦' },
  { code: 'NR', name: 'Nauru', flag: '🇳🇷' },
  { code: 'NP', name: 'Népal', flag: '🇳🇵' },
  { code: 'NI', name: 'Nicaragua', flag: '🇳🇮' },
  { code: 'NE', name: 'Niger', flag: '🇳🇪' },
  { code: 'NG', name: 'Nigeria', flag: '🇳🇬' },
  { code: 'NU', name: 'Niue', flag: '🇳🇺' },
  { code: 'NO', name: 'Norvège', flag: '🇳🇴' },
  { code: 'NC', name: 'Nouvelle-Calédonie', flag: '🇳🇨' },
  { code: 'NZ', name: 'Nouvelle-Zélande', flag: '🇳🇿' },
  { code: 'OM', name: 'Oman', flag: '🇴🇲' },
  { code: 'UG', name: 'Ouganda', flag: '🇺🇬' },
  { code: 'UZ', name: 'Ouzbékistan', flag: '🇺🇿' },
  { code: 'PK', name: 'Pakistan', flag: '🇵🇰' },
  { code: 'PW', name: 'Palaos', flag: '🇵🇼' },
  { code: 'PS', name: 'Palestine', flag: '🇵🇸' },
  { code: 'PA', name: 'Panama', flag: '🇵🇦' },
  { code: 'PG', name: 'Papouasie-Nouvelle-Guinée', flag: '🇵🇬' },
  { code: 'PY', name: 'Paraguay', flag: '🇵🇾' },
  { code: 'NL', name: 'Pays-Bas', flag: '🇳🇱' },
  { code: 'PE', name: 'Pérou', flag: '🇵🇪' },
  { code: 'PH', name: 'Philippines', flag: '🇵🇭' },
  { code: 'PL', name: 'Pologne', flag: '🇵🇱' },
  { code: 'PF', name: 'Polynésie Française', flag: '🇵🇫' },
  { code: 'PR', name: 'Porto Rico', flag: '🇵🇷' },
  { code: 'PT', name: 'Portugal', flag: '🇵🇹' },
  { code: 'QA', name: 'Qatar', flag: '🇶🇦' },
  { code: 'RE', name: 'Réunion', flag: '🇷🇪' },
  { code: 'RO', name: 'Roumanie', flag: '🇷🇴' },
  { code: 'GB', name: 'Royaume-Uni', flag: '🇬🇧' },
  { code: 'RU', name: 'Russie', flag: '🇷🇺' },
  { code: 'RW', name: 'Rwanda', flag: '🇷🇼' },
  { code: 'EH', name: 'Sahara Occidental', flag: '🇪🇭' },
  { code: 'BL', name: 'Saint-Barthélemy', flag: '🇧🇱' },
  { code: 'KN', name: 'Saint-Kitts-et-Nevis', flag: '🇰🇳' },
  { code: 'SM', name: 'Saint-Marin', flag: '🇸🇲' },
  { code: 'MF', name: 'Saint-Martin', flag: '🇲🇫' },
  { code: 'SX', name: 'Saint-Martin (Pays-Bas)', flag: '🇸🇽' },
  { code: 'PM', name: 'Saint-Pierre-et-Miquelon', flag: '🇵🇲' },
  { code: 'VA', name: 'Saint-Siège (Vatican)', flag: '🇻🇦' },
  { code: 'VC', name: 'Saint-Vincent-et-les-Grenadines', flag: '🇻🇨' },
  { code: 'LC', name: 'Sainte-Lucie', flag: '🇱🇨' },
  { code: 'SB', name: 'Salomon', flag: '🇸🇧' },
  { code: 'SV', name: 'Salvador', flag: '🇸🇻' },
  { code: 'WS', name: 'Samoa', flag: '🇼🇸' },
  { code: 'AS', name: 'Samoa Américaines', flag: '🇦🇸' },
  { code: 'ST', name: 'Sao Tomé-et-Principe', flag: '🇸🇹' },
  { code: 'SN', name: 'Sénégal', flag: '🇸🇳' },
  { code: 'RS', name: 'Serbie', flag: '🇷🇸' },
  { code: 'SC', name: 'Seychelles', flag: '🇸🇨' },
  { code: 'SL', name: 'Sierra Leone', flag: '🇸🇱' },
  { code: 'SG', name: 'Singapour', flag: '🇸🇬' },
  { code: 'SK', name: 'Slovaquie', flag: '🇸🇰' },
  { code: 'SI', name: 'Slovénie', flag: '🇸🇮' },
  { code: 'SO', name: 'Somalie', flag: '🇸🇴' },
  { code: 'SD', name: 'Soudan', flag: '🇸🇩' },
  { code: 'SS', name: 'Soudan du Sud', flag: '🇸🇸' },
  { code: 'LK', name: 'Sri Lanka', flag: '🇱🇰' },
  { code: 'SE', name: 'Suède', flag: '🇸🇪' },
  { code: 'CH', name: 'Suisse', flag: '🇨🇭' },
  { code: 'SR', name: 'Suriname', flag: '🇸🇷' },
  { code: 'SJ', name: 'Svalbard et Jan Mayen', flag: '🇸🇯' },
  { code: 'SY', name: 'Syrie', flag: '🇸🇾' },
  { code: 'TJ', name: 'Tadjikistan', flag: '🇹🇯' },
  { code: 'TW', name: 'Taïwan', flag: '🇹🇼' },
  { code: 'TZ', name: 'Tanzanie', flag: '🇹🇿' },
  { code: 'TD', name: 'Tchad', flag: '🇹🇩' },
  { code: 'CZ', name: 'Tchéquie', flag: '🇨🇿' },
  { code: 'TF', name: 'Terres Australes Françaises', flag: '🇹🇫' },
  { code: 'TH', name: 'Thaïlande', flag: '🇹🇭' },
  { code: 'TL', name: 'Timor-Leste', flag: '🇹🇱' },
  { code: 'TG', name: 'Togo', flag: '🇹🇬' },
  { code: 'TK', name: 'Tokelau', flag: '🇹🇰' },
  { code: 'TO', name: 'Tonga', flag: '🇹🇴' },
  { code: 'TT', name: 'Trinité-et-Tobago', flag: '🇹🇹' },
  { code: 'TN', name: 'Tunisie', flag: '🇹🇳' },
  { code: 'TM', name: 'Turkménistan', flag: '🇹🇲' },
  { code: 'TR', name: 'Turquie', flag: '🇹🇷' },
  { code: 'TV', name: 'Tuvalu', flag: '🇹🇻' },
  { code: 'UA', name: 'Ukraine', flag: '🇺🇦' },
  { code: 'UY', name: 'Uruguay', flag: '🇺🇾' },
  { code: 'VU', name: 'Vanuatu', flag: '🇻🇺' },
  { code: 'VE', name: 'Venezuela', flag: '🇻🇪' },
  { code: 'VN', name: 'Viêt Nam', flag: '🇻🇳' },
  { code: 'WF', name: 'Wallis-et-Futuna', flag: '🇼🇫' },
  { code: 'YE', name: 'Yémen', flag: '🇾🇪' },
  { code: 'ZM', name: 'Zambie', flag: '🇿🇲' },
  { code: 'ZW', name: 'Zimbabwe', flag: '🇿🇼' },
];

interface CountrySelectProps {
  value?: string;
  onChange: (countryCode: string) => void;
  error?: string;
  disabled?: boolean;
  placeholder?: string;
}

export default function CountrySelect({
  value = 'SN',
  onChange,
  error,
  disabled = false,
  placeholder = 'Sélectionner un pays',
}: CountrySelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedCountry = COUNTRIES.find((c) => c.code === value) || COUNTRIES.find((c) => c.code === 'SN');

  const filteredCountries = COUNTRIES.filter((country) =>
    country.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    country.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  const handleSelect = (countryCode: string) => {
    onChange(countryCode);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleToggle = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
      setSearchTerm('');
    }
  };

  return (
    <div ref={containerRef} className="relative">
      {/* Select Button */}
      <button
        type="button"
        onClick={handleToggle}
        disabled={disabled}
        className={`w-full px-4 py-2.5 rounded-lg border-2 bg-white text-left flex items-center justify-between transition-colors ${
          error
            ? 'border-red-500 focus:border-red-500'
            : 'border-gray-200 focus:border-primary'
        } ${disabled ? 'opacity-50 cursor-not-allowed bg-gray-50' : 'hover:border-primary'} focus:outline-none`}
      >
        <div className="flex items-center gap-2">
          {selectedCountry ? (
            <>
              <span className="text-xl">{selectedCountry.flag}</span>
              <span className="text-gray-900">{selectedCountry.name}</span>
              <span className="text-gray-400 text-sm">({selectedCountry.code})</span>
            </>
          ) : (
            <span className="text-gray-400">{placeholder}</span>
          )}
        </div>
        <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Error Message */}
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white rounded-lg border-2 border-gray-200 shadow-xl max-h-96 overflow-hidden">
          {/* Search Input */}
          <div className="p-3 border-b border-gray-200 sticky top-0 bg-white">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Rechercher un pays..."
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:border-primary focus:outline-none text-sm"
              />
            </div>
          </div>

          {/* Countries List */}
          <div className="overflow-y-auto max-h-80">
            {filteredCountries.length > 0 ? (
              filteredCountries.map((country) => (
                <button
                  key={country.code}
                  type="button"
                  onClick={() => handleSelect(country.code)}
                  className={`w-full px-4 py-2.5 text-left flex items-center justify-between hover:bg-blue-50 transition-colors ${
                    value === country.code ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{country.flag}</span>
                    <span className="text-gray-900">{country.name}</span>
                    <span className="text-gray-400 text-sm">({country.code})</span>
                  </div>
                  {value === country.code && <Check className="w-5 h-5 text-primary" />}
                </button>
              ))
            ) : (
              <div className="px-4 py-8 text-center text-gray-500">
                <p className="text-sm">Aucun pays trouvé</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
