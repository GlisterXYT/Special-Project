const puppeteer = require('puppeteer-extra');
const readline = require('readline');
const path = require('path');
const puppeteerCore = require('puppeteer-core');

// Add stealth plugin and adblocker plugin
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const AdblockerPlugin = require('puppeteer-extra-plugin-adblocker');
puppeteer.use(StealthPlugin());
puppeteer.use(AdblockerPlugin({ blockTrackers: true }));

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'; // Path to Edge executable
const captchaExtensionPath = path.join(__dirname, 'CAPTCHA'); // Path to CAPTCHA extension directory
const vpnExtensionPath = path.join(__dirname, 'VPN'); // Path to VPN extension directory

// Function to wait for 'L' key press
function waitForL() {
    return new Promise(resolve => {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        rl.question('Please log in manually and press "L" in the console when done.\n', (input) => {
            if (input.trim().toLowerCase() === 'l') {
                rl.close();
                resolve();
            } else {
                console.log('Invalid input. Please press "L" when you have logged in.');
                rl.close();
                resolve(waitForL());
            }
        });
    });
}

// Function to set the required cookies on all visited websites
async function setCookies(page) {
    const cookies = [
        {
            name: 'hc_accessibility',
            value: '1ekhcxWCeBmqxWCm5bcyHWV0wuffD7stbbxK65v4DT354/apD8wZBBnsPdta0qr+cEcGCm/xtve3/vzIW1735uTAKEVwjmF6I9J1qUo0WLzSAUj7sSHfXNKkNhBJE+RdAUhhImX83uN5IY+fopGvHAvyE9g5loWBg3HmoGxKmPyrx8PYEWYDcvN6gmjat2/KTgzNKXTVDeX1dJQqLqrb5WVSBT6isWCmdGWfVUFTBh0Gk+stvhU8BdlOUttscLWft0C2HDusiK+f5cKn+wZebE/s5esTugncrYdJtKAUC54CgzacxjeiwQwx7FiSpuDhs/Sxvrs5tJa5zVR813zJmd7/J1iCH6ZAiwYycM514JM5OIlEdvqjVHZSRems5wo5h5l2Ic1bB/DxkC+K+YxAAey8nX1py6MjT/miwtu9GH24G4qQMXfoj5Fw/aAL471+kNJMt4Pzbeou7ujeiCa1taLGqJ2hIOX172epPPFp0H00UnVcPNZ4h4WHLhnOq8onIB59TVAxSH5FkwgGLH50TsE3UcUbZq2zmuYMYZq2rA+cyV6RoEjcAEbt9HQ+oZAwXCrFHy0ae+f+JE0hEiPxLgxmqgCwtqfiNSxue68ZS4aiLGATi1Z5LGKG1+f6rQRHRab2Qn6J402aKHdvxdbuWPm+GDWveX2+NUo2NbQMlaf0mhRQWdsxXUBvfHblUmtWO1CqjSGaLrp4/BkfbdZwj2xMWsgqqCodNxBzpCCowa79Dihy0sagyKbkpduiBq5iOVvjHBpQezHzw8DJqrKeSqz5Ao5qnZ+BmvQI6JBovhhwtVcyYnzGrT5+X2bLPmUce6e3ZBEMlSSJhkE10b5C+558L6z5g8oR+HfQzEvhqhTfeNNvlS4eJ6R5BOV02zN30HnTQPOIS5T9a2Db0vsvUlwU1yLrpHhqPH6+oSOik9kBG3Dvtbu8Q1xQOsVFYce6dJZUl++0Gntzty/l65Rm/qS87Akx3CuqmeW7bk5U17XGZ3r9W4H5VmvTYJ40HeQpuhxsGQSbbGDDgxUgFqzF1CdmaEsG+NWOWpWWiWWMc9+W8sNJdpIy+9l0KMLXs4bTpJfYSQnkZeIa/LXM+YlJShyghMzKh3fZeGMcTxkggjLRNvIFI+uNNZoYnnWc0z/N',
            domain: '',
            path: '/',
            httpOnly: false,
            secure: false
        },
        {
            name: 'hmt_id',
            value: '009c592e-915d-4070-b851-6445bb461dba',
            domain: '',
            path: '/',
            httpOnly: false,
            secure: false
        }
    ];

    // Use the page.setCookie for the current domain
    const setCookieForDomain = async (domain) => {
        cookies.forEach(cookie => cookie.domain = domain);
        await page.setCookie(...cookies);
        console.log(`Cookies set for domain: ${domain}`);
    };

    // Get current domain and set the cookies
    const currentUrl = new URL(page.url());
    await setCookieForDomain(currentUrl.hostname);
}

(async () => {
    const browser = await puppeteerCore.launch({
        executablePath: edgePath, // Use Edge executable
        headless: false,
        args: [
            `--disable-extensions-except=${captchaExtensionPath},${vpnExtensionPath}`,
            `--load-extension=${captchaExtensionPath},${vpnExtensionPath}`,
            '--enable-features=NetworkService,NetworkServiceInProcess'
        ]
    });
    const page = await browser.newPage();
    await page.goto('https://rollbet.gg/');
    console.log('Navigated to Rollbet.');

    // Automatically set the required cookies for the initial website
    await setCookies(page);
    
    // Listen to page navigations to set the cookies for each new domain
    page.on('framenavigated', async (frame) => {
        if (frame === page.mainFrame()) {
            await setCookies(page);
        }
    });

    // Wait for the user to log in manually
    await waitForL(); // Wait for 'L' key press
    console.log('User pressed "L". Proceeding with script.');

    // Function to check for the button and perform actions
    async function checkButton() {
        try {
            console.log('Checking for the button...');
            const button = await page.$('button.octagonal.before.after.hoverable.e593a4bf');
            if (button) {
                await button.click();
                console.log('Button clicked!');

                // Wait for the hCaptcha to appear and solve it using the accessibility cookie
                const hCaptchaFrame = await page.waitForSelector('.h-captcha iframe', { timeout: 60000 });
                if (hCaptchaFrame) {
                    console.log('hCaptcha appeared, solving with accessibility...');

                    // Click the submit button after captcha is solved
                    const submitButton = await page.waitForSelector('button[type="submit"]', { timeout: 60000 });
                    if (submitButton) {
                        await submitButton.click();
                        console.log('Submit button clicked!');
                    }
                }
            } else {
                console.log('Button not found, retrying...');
            }
        } catch (error) {
            console.error('An error occurred:', error);
        }
    }

    // Check for the button every 10 seconds (10,000 milliseconds)
    setInterval(checkButton, 10000);

    // Keep the browser open
})();
