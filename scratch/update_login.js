const fs = require('fs');
let code = fs.readFileSync('src/app/login/page.js', 'utf8');

// replace the login action handler to check for needsName
const oldHandler = `
      const result = await loginOrRegister(null, formData);
      if (result?.error) {
        setError(result.error);
      } else if (result?.success) {
        if (result.role === 'admin') {
          router.push('/dashboard');
        } else if (result.role === 'staff') {
          router.push('/staff-portal');
        } else {
          // If customer and source is walkin, preserve it!
          if (source === 'walkin') {
            router.push('/?source=walkin');
          } else {
            router.push('/');
          }
        }
      }
`;

const newHandler = `
      const result = await loginOrRegister(null, formData);
      if (result?.error) {
        setError(result.error);
      } else if (result?.success) {
        if (result.role === 'admin') {
          router.push('/dashboard');
        } else if (result.role === 'staff') {
          router.push('/staff-portal');
        } else if (result.needsName) {
          setNeedsNameForm(true);
        } else {
          // If customer and source is walkin, preserve it!
          if (source === 'walkin') {
            router.push('/?source=walkin');
          } else {
            router.push('/');
          }
        }
      }
`;

code = code.replace(oldHandler.trim(), newHandler.trim());

// add needsName state and name input step
code = code.replace(/const \[isPending, startTransition\] = useTransition\(\);/, "const [isPending, startTransition] = useTransition();\n  const [needsNameForm, setNeedsNameForm] = useState(false);\n  const [name, setName] = useState('');");
code = code.replace(/import \{ loginOrRegister \} from '@\/app\/actions\/auth';/, "import { loginOrRegister, updateUserName } from '@/app/actions/auth';");

const newForm = `
        {needsNameForm ? (
          <form className={styles.form} onSubmit={handleNameSubmit}>
            <div style={{ textAlign: 'center', marginBottom: '1rem', color: 'var(--text)' }}>
              <h3>Welcome to Rishi Hairstyles!</h3>
              <p style={{ color: 'var(--text-muted)' }}>What should we call you?</p>
            </div>
            {error && <div className={styles.error}>{error}</div>}
            <div className={styles.inputGroup}>
              <input
                type="text"
                className={styles.input}
                placeholder="Your Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                style={{ width: '100%', paddingLeft: '1rem' }}
              />
            </div>
            <button type="submit" className={styles.btnPrimary} disabled={isPending}>
              {isPending ? 'Saving...' : 'Enter Salon'}
            </button>
          </form>
        ) : (
          <form className={styles.form} onSubmit={handleSubmit}>
`;

code = code.replace(/<form className=\{styles\.form\} onSubmit=\{handleSubmit\}>/, newForm.trim());
code = code.replace(/<\/form>\s*<div className=\{styles\.divider\}>/s, "</form>\n        )} \n        {!needsNameForm && <div className={styles.divider}>");

const nameHandler = `
  const handleNameSubmit = (e) => {
    e.preventDefault();
    setError('');
    const formData = new FormData();
    formData.append('name', name);
    startTransition(async () => {
      const res = await updateUserName(formData);
      if (res?.error) setError(res.error);
      else {
        if (source === 'walkin') router.push('/?source=walkin');
        else router.push('/');
      }
    });
  };
`;

code = code.replace(/const handleBiometricLogin/, nameHandler + "\n  const handleBiometricLogin");

// Hide alternative login methods if in name step
code = code.replace(/<span>Use Passkey \/ Biometrics<\/span>\s*<\/button>/s, "<span>Use Passkey / Biometrics</span>\n        </button>\n        )}");

fs.writeFileSync('src/app/login/page.js', code);
