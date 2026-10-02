import fs from 'fs';

const path = 'src/app/(admin)/marketing/page.js';
let content = fs.readFileSync(path, 'utf8');

const importReplacement = `import { 
  ToggleRight, 
  ToggleLeft, 
  Edit, 
  Trash2, 
  Plus, 
  Send, 
  Share2, 
  Camera, 
  Users, 
  Image as ImageIcon 
} from 'lucide-react';
import styles from './marketing.module.css';
import TopBar from '@/components/TopBar/TopBar';
import BottomNav from '@/components/BottomNav/BottomNav';
import { addOffer, getAllOffers, toggleOfferStatus, deleteOffer } from '@/app/actions/data';`;

content = content.replace(/import \{[\s\S]*?from '@/app\/actions\/data';/, importReplacement);

const stateReplacement = `export default function MarketingHub() {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showOfferModal, setShowOfferModal] = useState(false);
  const [modalInput, setModalInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadOffers();
  }, []);

  const loadOffers = async () => {
    setLoading(true);
    const data = await getAllOffers();
    setOffers(data);
    setLoading(false);
  };

  const handleAddOffer = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    const res = await addOffer(modalInput);
    if (res.success) {
      alert('Offer published to Customer App!');
      setShowOfferModal(false);
      setModalInput('');
      loadOffers();
    } else {
      alert(res.error || 'Failed to add offer');
    }
    setIsSubmitting(false);
  };

  const handleToggleOffer = async (id, currentStatus) => {
    const res = await toggleOfferStatus(id, currentStatus);
    if (res.success) {
      loadOffers();
    } else {
      alert(res.error || 'Failed to toggle offer');
    }
  };

  const handleDeleteOffer = async (id) => {
    if (confirm("Are you sure you want to delete this offer?")) {
      const res = await deleteOffer(id);
      if (res.success) {
        loadOffers();
      } else {
        alert(res.error || 'Failed to delete offer');
      }
    }
  };`;

content = content.replace(/export default function MarketingHub\(\) \{[\s\S]*?const toggleOffer = \(id\) => \{[\s\S]*?\}\;/s, stateReplacement);

const toggleButtonReplacement = `<button 
                    className={\`\${styles.toggleSwitch} \${offer.is_active ? styles.active : ''}\`}
                    onClick={() => handleToggleOffer(offer.id, offer.is_active)}
                    aria-label={\`Toggle \${offer.title}\`}
                  >
                    {offer.is_active ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
                  </button>
                  <button className={styles.iconButton} aria-label="Edit offer" onClick={() => alert('Editing is coming soon!')}>
                    <Edit size={18} />
                  </button>
                  <button className={styles.iconButton} aria-label="Delete offer" onClick={() => handleDeleteOffer(offer.id)}>
                    <Trash2 size={18} />
                  </button>`;
content = content.replace(/<button \s*className=\{\`\$\{styles\.toggleSwitch\} \$\{offer\.active \? styles\.active : ''\}\`\}[\s\S]*?<\/button>\s*<\/div>/, toggleButtonReplacement + '\n                </div>');

const addOfferButtonReplacement = `<button className={styles.primaryButton} onClick={() => setShowOfferModal(true)}>
              <Plus size={16} /> Create New
            </button>`;
content = content.replace(/<button className=\{styles\.primaryButton\}>\s*<Plus size=\{16\} \/> Create New\s*<\/button>/s, addOfferButtonReplacement);

fs.writeFileSync(path, content);
