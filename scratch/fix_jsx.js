const fs = require('fs');
let code = fs.readFileSync('src/app/login/page.js', 'utf8');

const bad = `{!needsNameForm && <div className={styles.divider}>
          <span>or log in instantly with</span>
        </div>

        <button type="button" className={styles.btnGoogle} onClick={handleBiometricLogin}>
          <Fingerprint size={20} />
          <span>Use Passkey / Biometrics</span>
        </button>
        )}`;

const good = `{!needsNameForm && (
          <>
            <div className={styles.divider}>
              <span>or log in instantly with</span>
            </div>

            <button type="button" className={styles.btnGoogle} onClick={handleBiometricLogin}>
              <Fingerprint size={20} />
              <span>Use Passkey / Biometrics</span>
            </button>
          </>
        )}`;

code = code.replace(bad, good);
fs.writeFileSync('src/app/login/page.js', code);
