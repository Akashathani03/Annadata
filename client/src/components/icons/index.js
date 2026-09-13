// Single source of truth for every UI-chrome icon in the app. Every
// component imports icons from here, never directly from lucide-react -
// this is what makes "same icon set everywhere" an actual guarantee
// rather than a convention someone can accidentally break, and makes
// swapping the icon library later a one-file change.
export {
  ArrowLeft as IconBack,
  Menu as IconMenu,
  MoreVertical as IconMoreVertical,
  Pin as IconPin,
  Clock as IconClock,
  Pencil as IconEdit,
  Trash2 as IconDelete,
  Bell as IconNotifications,
  Navigation as IconCurrentLocation,
  MapPin as IconLocationPin,
  Search as IconSearch,
  Plus as IconAdd,
  User as IconProfile,
  Settings as IconSettings,
  HelpCircle as IconHelp,
  X as IconClose,
  Phone as IconCall,
  MessageCircle as IconChat,
  Home as IconHome,
  ClipboardList as IconListings,
  Store as IconShop,
  Package as IconPackage,
  ChevronRight as IconChevronRight,
  Image as IconPhoto,
  Eye as IconEye,
  Camera as IconCamera,
  Send as IconSend,
  Leaf as IconLeaf,
  Bug as IconBug,
  Droplet as IconDroplet,
  Cloud as IconCloud,
  IndianRupee as IconRupee,
  ChevronDown as IconChevronDown,
  AlertTriangle as IconAlertTriangle,
  CircleCheck as IconCircleCheck,
  Gauge as IconGauge,
  ShieldCheck as IconShieldCheck,
  CloudRain as IconCloudRain,
  Droplets as IconDroplets,
  Wind as IconWind,
  TrendingUp as IconTrendingUp,
  TrendingDown as IconTrendingDown,
  Minus as IconTrendStable,
  Sprout as IconSprout,
  Calendar as IconCalendar,
  SprayCan as IconSprayCan,
  RefreshCw as IconRefresh,
  Share2 as IconShare,
  Mail as IconMail,
} from 'lucide-react';

// lucide-react dropped brand/trademarked logos (Instagram, Facebook,
// YouTube, etc. all removed) - re-exported from a small hand-authored
// set instead, so callers still only ever import icons from this one
// file.
export { IconInstagram, IconFacebook, IconYoutube } from './brandIcons';
