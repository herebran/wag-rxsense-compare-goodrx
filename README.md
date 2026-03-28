<p align="center">
  <img src="https://walgreens.rxsense.com/images/Walgreens_logo_with_rx.png" alt="Walgreens Rx Savings Finder" height="60"/>
  &nbsp;&nbsp;&nbsp;&nbsp;
  <img src="https://i.ibb.co/yFqb7GZV/Good-Rx-Logo.png" alt="GoodRx" height="60"/>
  <br/><br/>
  <strong>GoodRx Compare Button Userscript</strong>
</p>

A Tampermonkey script built for Walgreens RxSense that helps pharmacy technicians compare prescription prices against GoodRx. Adds a floating button that redirects directly to the matching GoodRx page with all filters pre-applied.

---

## Why This Script Exists

Pharmacy technicians regularly use the [Walgreens Rx Savings Finder](https://walgreens.rxsense.com/) to look up drug pricing for patients. When a cheaper option might be available through a coupon site like GoodRx, there is no quick way to get there. You have to open a new tab, go to GoodRx, search for the drug, and then manually match the form, dosage, and quantity to what the patient has on file.

This script solves that by injecting a floating **Compare on GoodRx** button on every drug page. It reads the selected drug name, form, dosage, and quantity directly from the page dropdowns and builds the GoodRx link automatically. One click and you are already on the right page with the right filters.

## Demo

*(gif goes here)*

## Installation

1. Install the [Tampermonkey](https://www.tampermonkey.net/) browser extension for Chrome, Firefox, or Edge
2. **Important:** After installing Tampermonkey, go to your browser extension settings, find Tampermonkey, and make sure **Allow User Scripts** is enabled -- without this, the script will not run
3. Click this link to install the script directly: [Install Script](https://raw.githubusercontent.com/herebran/wag-rxsense-compare-goodrx/main/Walgreens_RxSense_Compare_GoodRx.user.js)
4. Tampermonkey will open a confirmation page -- click **Install**
5. Navigate to any drug page on [walgreens.rxsense.com](https://walgreens.rxsense.com/) and the button will appear automatically

## How It Works

1. Search for a drug on the Walgreens Rx Savings Finder as you normally would
2. Select the form, dosage, and quantity for the patient
3. Click the yellow **Compare on GoodRx** button in the bottom right corner of the page
4. GoodRx will open in a new tab already filtered to the exact drug, form, dosage, and quantity you had selected

The button updates live as you change the dropdowns, so you do not need to click anything before switching options.

## Known Limitations

The script handles most drugs correctly but it is not perfect. Some drugs may not redirect properly due to differences in how RxSense and GoodRx name or categorize certain medications. This is especially common with biosimilars, combination drugs, and specialty medications where the two sites use different naming conventions.

If you run into a drug that does not redirect correctly, please open an issue on this repository and include the RxSense URL and the correct GoodRx URL. That is the fastest way to get it fixed and added to the script.

## Disclaimer

This script is an unofficial browser tool and is not affiliated with, endorsed by, or supported by Walgreens, RxSense, GoodRx, or any related company. It is intended solely to improve the workflow of pharmacy staff. Use at your own discretion.
