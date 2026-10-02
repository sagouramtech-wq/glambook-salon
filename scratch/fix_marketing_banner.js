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
import { addOffer } from '@/app/actions/data';`;

content = content.replace(/import \{[\s\S]*?from '@/components/BottomNav';/, importReplacement);

const stateReplacement = `export default function MarketingHub() {
  const [offers, setOffers] = useState([
    { id: 1, title: '30% Off Hair Spa', expiry: 'Expires in 5 days', active: true },
    { id: 2, title: 'Festive Glow Combo', expiry: 'Expires in 12 days', active: false },
  ]);

  const [showOfferModal, setShowOfferModal] = useState(false);
  const [modalInput, setModalInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddOffer = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    const res = await addOffer(modalInput);
    if (res.success) {
      alert('Offer published to Customer App!');
      setShowOfferModal(false);
      setModalInput('');
    } else {
      alert(res.error || 'Failed to add offer');
    }
    setIsSubmitting(false);
  };`;

content = content.replace(/export default function MarketingHub\(\) \{[\s\S]*?\}\];\s*\n/, stateReplacement + '\n');

const editBannerButtonReplacement = `<button className={styles.secondaryButton} style={{ width: '100%', justifyContent: 'center' }} onClick={() => setShowOfferModal(true)}>
              <Edit size={16} /> Edit Banner
            </button>`;
content = content.replace(/<button className=\{styles\.secondaryButton\}.*?Edit Banner\s*<\/button>/s, editBannerButtonReplacement);

const modalHtml = `
      {showOfferModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: '1rem'
        }}>
          <div style={{
            background: 'var(--card)', width: '100%', maxWidth: '400px',
            borderRadius: '24px', padding: '1.5rem', border: '1px solid rgba(255,255,255,0.1)'
          }}>
            <h2 style={{ margin: '0 0 1rem 0', color: 'var(--text)' }}>Create Live Offer</h2>
            <form onSubmit={handleAddOffer} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <input
                type="text"
                required
                placeholder="e.g., 50% Off Hair Spa Today!"
                value={modalInput}
                onChange={e => setModalInput(e.target.value)}
                style={{ background: 'var(--bg)', border: '1px solid rgba(255,255,255,0.1)', padding: '12px', borderRadius: '12px', color: 'white' }}
              />
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button type="button" onClick={() => {setShowOfferModal(false); setModalInput('');}} style={{ flex: 1, padding: '12px', background: 'transparent', border: '1px solid var(--text-muted)', color: 'var(--text-muted)', borderRadius: '12px' }}>Cancel</button>
                <button type="submit" disabled={isSubmitting} style={{ flex: 1, padding: '12px', background: 'var(--primary)', border: 'none', color: 'var(--bg)', borderRadius: '12px', fontWeight: 'bold' }}>
                  {isSubmitting ? 'Sending...' : 'Publish'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <BottomNav active="marketing" variant="admin" />
    </div>
  );
}`;

content = content.replace(/<BottomNav activeTab="marketing" variant="admin" \/>\s*<\/div>\s*\);\s*}/s, modalHtml);

fs.writeFileSync(path, content);
