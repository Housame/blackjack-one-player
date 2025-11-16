// ====== Blackjack med 1 spelare (SVENSKA) ======
// Kortbilder via länk från deckofcardsapi.com, t.ex. https://deckofcardsapi.com/static/img/AS.png
// Ranks: A,2,3,4,5,6,7,8,9,0(=10),J,Q,K | Suits: C(♣), D(♦), H(♥), S(♠)

const $ = (sel) => document.querySelector(sel);

const bankrollEl = $("#bankroll");
const betInput = $("#bet-amount");
const dealerCardsEl = $("#dealer-cards");
const playerCardsEl = $("#player-cards");
const dealerScoreEl = $("#dealer-score");
const playerScoreEl = $("#player-score");
const messageEl = $("#message");

const btnDeal = $("#btn-deal");
const btnHit = $("#btn-hit");
const btnStand = $("#btn-stand");
const btnNew = $("#btn-new");
const btnBetMin = $("#bet-min");
const btnBetPlus = $("#bet-plus");
const btnBetMax = $("#bet-max");

let deck = [];
let playerHand = [];
let dealerHand = [];
let bankroll = 1000;
let currentBet = 50;
let inRound = false;
let roundOver = false;

// Bygg ett standardkortlek (52 kort)
function buildDeck(){
  const ranks = ["A","2","3","4","5","6","7","8","9","0","J","Q","K"]; // 0 = 10
  const suits = ["C","D","H","S"];
  const getValue = (r) => {
    if (r === "A") return 11;
    if (["K","Q","J","0"].includes(r)) return 10;
    return parseInt(r, 10);
  };
  const deck = [];
  for (const s of suits){
    for (const r of ranks){
      deck.push({
        rank: r === "0" ? "10" : r,
        suit: s,
        value: getValue(r),
        code: r + s, // används för bildlänken
        img: `https://deckofcardsapi.com/static/img/${r}${s}.png`
      });
    }
  }
  return deck;
}

// Fisher–Yates-shuffle
function shuffle(array){
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// Räkna poäng (ess = 11 eller 1)
function handValue(hand){
  let total = 0;
  let aces = 0;
  for (const c of hand){
    total += c.value;
    if (c.rank === "A") aces++;
  }
  while (total > 21 && aces > 0){
    total -= 10; // räkna ett ess som 1 istället för 11
    aces--;
  }
  return total;
}

function renderHands(hideDealerHole = true){
  // Återställ
  dealerCardsEl.innerHTML = "";
  playerCardsEl.innerHTML = "";

  // Dealer
  dealerHand.forEach((c, idx) => {
    const img = document.createElement("img");
    img.className = "card";
    if (idx === 0 && hideDealerHole && inRound){
      img.src = "https://deckofcardsapi.com/static/img/back.png";
      img.alt = "Dolt kort";
    } else {
      img.src = c.img;
      img.alt = `${c.rank} of ${c.suit}`;
    }
    dealerCardsEl.appendChild(img);
  });

  // Spelare
  playerHand.forEach((c) => {
    const img = document.createElement("img");
    img.className = "card";
    img.src = c.img;
    img.alt = `${c.rank} of ${c.suit}`;
    playerCardsEl.appendChild(img);
  });

  // Poäng
  dealerScoreEl.textContent = hideDealerHole && inRound
    ? handValue([dealerHand[1] || {value:0}]) // visa bara synligt kort under pågående runda
    : handValue(dealerHand);
  playerScoreEl.textContent = handValue(playerHand);
}

function setMessage(text){
  messageEl.textContent = text;
}

function updateBetButtons(){
  currentBet = Math.max(10, Math.min(parseInt(betInput.value || 0,10), bankroll));
  betInput.value = currentBet;
}

function resetRoundUI(){
  btnHit.disabled = true;
  btnStand.disabled = true;
  btnDeal.disabled = bankroll < 10;
  inRound = false;
}

// Resultathantering
function settleRound(){
  const player = handValue(playerHand);
  const dealer = handValue(dealerHand);

  if (player > 21){
    bankroll -= currentBet;
    setMessage(`Du bustar (${player}) – du förlorar ${currentBet} kr.`);
  } else if (dealer > 21){
    bankroll += currentBet;
    setMessage(`Dealer bustar (${dealer}) – du vinner ${currentBet} kr!`);
  } else if (player > dealer){
    bankroll += currentBet;
    setMessage(`Du vinner! ${player} mot ${dealer} (+${currentBet} kr)`);
  } else if (player < dealer){
    bankroll -= currentBet;
    setMessage(`Dealer vinner. ${player} mot ${dealer} (-${currentBet} kr)`);
  } else {
    setMessage(`Push – lika (${player}). Insats åter.`);
  }
  bankrollEl.textContent = bankroll;
  resetRoundUI();
  roundOver = true;
}

// Dealer drar till minst 17
function dealerPlay(){
  while (handValue(dealerHand) < 17){
    dealerHand.push(deck.pop());
  }
  renderHands(false);
  settleRound();
}

// Event: Dela
btnDeal.addEventListener("click", () => {
  updateBetButtons();
  if (bankroll < 10){ setMessage("För lågt saldo. Starta om spelet."); return; }
  if (currentBet > bankroll){ setMessage("Insats kan inte vara större än saldo."); return; }

  // Ny runda
  deck = shuffle(buildDeck());
  playerHand = [deck.pop(), deck.pop()];
  dealerHand = [deck.pop(), deck.pop()];
  roundOver = false;
  inRound = true;

  btnHit.disabled = false;
  btnStand.disabled = false;
  btnDeal.disabled = true;
  setMessage("Lycka till! Vill du ta ett kort (Hit) eller stanna (Stand)?");

  renderHands(true);

  // Kolla naturlig blackjack (21 på 2 kort)
  const p = handValue(playerHand);
  const d = handValue(dealerHand);
  if (p === 21 || d === 21){
    renderHands(false); // visa hole card
    if (p === 21 && d !== 21){
      bankroll += Math.floor(currentBet * 1.5);
      setMessage(`BLACKJACK! Du får 3:2 (+${Math.floor(currentBet*1.5)} kr)`);
      bankrollEl.textContent = bankroll;
      resetRoundUI();
      roundOver = true;
    } else if (d === 21 && p !== 21){
      bankroll -= currentBet;
      setMessage("Dealer har blackjack. Omgången är över.");
      bankrollEl.textContent = bankroll;
      resetRoundUI();
      roundOver = true;
    } else {
      setMessage("Båda har blackjack – push.");
      resetRoundUI();
      roundOver = true;
    }
  }
});

// Event: Hit
btnHit.addEventListener("click", () => {
  if (!inRound) return;
  playerHand.push(deck.pop());
  renderHands(true);
  const p = handValue(playerHand);
  if (p > 21){
    // bust direkt
    renderHands(false);
    settleRound();
  }
});

// Event: Stand
btnStand.addEventListener("click", () => {
  if (!inRound) return;
  inRound = false;
  renderHands(false);
  setMessage("Dealern spelar...");
  setTimeout(dealerPlay, 600);
});

// Ny omgång (behåll saldo)
btnNew.addEventListener("click", () => {
  // Rensa bordet men behåll saldo
  playerHand = [];
  dealerHand = [];
  dealerCardsEl.innerHTML = "";
  playerCardsEl.innerHTML = "";
  dealerScoreEl.textContent = "0";
  playerScoreEl.textContent = "0";
  setMessage("Ny omgång redo. Sätt insats och tryck Dela.");
  resetRoundUI();
});

// Bet-knappar
btnBetMin.addEventListener("click", () => { betInput.value = Math.min(bankroll, parseInt(betInput.value||0,10) + 10); updateBetButtons(); });
btnBetPlus.addEventListener("click", () => { betInput.value = Math.min(bankroll, parseInt(betInput.value||0,10) + 50); updateBetButtons(); });
btnBetMax.addEventListener("click", () => { betInput.value = bankroll; updateBetButtons(); });
betInput.addEventListener("change", updateBetButtons);

// Init
function init(){
  bankrollEl.textContent = bankroll;
  setMessage("Välkommen! Ange insats och klicka Dela för att börja.");
  resetRoundUI();
}
init();
