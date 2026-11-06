import { db } from "./firebase.js";
import {
  ref,
  set,
  get,
  onValue,
  update,
  runTransaction,
  remove
} from "https://www.gstatic.com/firebasejs/13.2.0/firebase-database.js";

const $ = (id) => document.getElementById(id);
const names = {tictactoe:"Tic-Tac-Toe",connect4:"Connect 4",rps:"Rock Paper Scissors",dots:"Dots & Boxes",battleship:"Battleship"};
let gameKey="", roomId="", player=0, roomRef=null, unsubscribe=null, roomData=null, selectedGame="";
const urlRoom = new URLSearchParams(location.search).get("room");

function showScreen(id){document.querySelectorAll(".screen").forEach(s=>s.classList.remove("active"));$(id).classList.add("active");}
function toast(msg){$("toast").textContent=msg;$("toast").classList.add("show");setTimeout(()=>$("toast").classList.remove("show"),2400);}
function code(){return Math.random().toString(36).slice(2,7).toUpperCase();}
function cleanCode(s){return s.trim().toUpperCase().replace(/[^A-Z0-9]/g,"").slice(0,6);}
function initialState(game){
  if(game==="tictactoe")return {board:Array(9).fill(""),turn:1,winner:0};
  if(game==="connect4")return {board:Array(42).fill(0),turn:1,winner:0};
  if(game==="rps")return {moves:{},round:1,scores:[0,0],winner:0};
  if(game==="dots")return {edges:{},boxes:{},turn:1,scores:[0,0],winner:0};
  if(game==="battleship")return {ships:{},shots:{},ready:{},turn:1,winner:0};
}
function gameInitial(game){return {game,state:initialState(game),players:{1:{name:"Player 1"},2:null},createdAt:Date.now()};}
function getRoomUrl(){return `${location.origin}${location.pathname}?room=${roomId}`;}
async function createRoom(game){
  if(!firebaseReady()){toast("Add your Firebase config first.");return;}
  selectedGame=game;roomId=code();player=1;roomRef=ref(db,"rooms/"+roomId);
  await set(roomRef,gameInitial(game));subscribeRoom();showScreen("room");toast("Room created. Share the link!");
}
async function joinRoom(id){
  if(!firebaseReady()){ $("joinError").textContent="Firebase config is missing. Set it in js/firebase.js.";return;}
  roomId=cleanCode(id);if(!roomId){$("joinError").textContent="Enter a valid room code.";return;}
  roomRef=ref(db,"rooms/"+roomId);
  try{
    const snap=await get(roomRef);if(!snap.exists())throw new Error("Room not found. Check the code.");
    const data=snap.val();selectedGame=data.game;
    if(data.players?.[2])throw new Error("This room already has two players.");
    player=2;
    await update(roomRef,{["players/2"]:{name:"Player 2"}});
    subscribeRoom();showScreen("room");
  }catch(e){$("joinError").textContent=e.message||"Could not join room.";}
}
function subscribeRoom(){
  if(unsubscribe)unsubscribe();
  unsubscribe=onValue(roomRef,snap=>{
    if(!snap.exists()){toast("Room closed.");showScreen("home");return;}
    roomData=snap.val();selectedGame=roomData.game;renderRoom();
  },err=>toast("Connection error: "+err.message));
}
function firebaseReady() {
  return true;
}
function renderRoom(){
  $("roomGameTitle").textContent=names[selectedGame]||"Game";
  $("roomCode").textContent=roomId;
  $("p1name").textContent=roomData.players?.[1]?.name||"Player 1";
  $("p2name").textContent=roomData.players?.[2]?.name||"Player 2";
  $("p2status").textContent=roomData.players?.[2]?"Connected":"Waiting to join…";
  $("p1symbol").textContent=selectedGame==="connect4"?"🔴":selectedGame==="battleship"?"🚢":selectedGame==="rps"?"✊":"X";
  $("p2symbol").textContent=selectedGame==="connect4"?"🟡":selectedGame==="battleship"?"🚢":selectedGame==="rps"?"✋":"O";
  renderGame();
}
function status(text){$("gameStatus").textContent=text;}
function currentTurn(state){return state.turn===player?"Your turn":"Opponent's turn";}
function isWinnerTtt(b){for(const [a,c,d] of [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]])if(b[a]&&b[a]===b[c]&&b[c]===b[d])return b[a];return b.every(Boolean)?"draw":"";}
function renderGame(){
  const s=roomData.state;const board=$("gameBoard");board.innerHTML="";
  if(!roomData.players?.[2]){status("Waiting for your friend to join…");}
  else if(s.winner)status(s.winner==="draw"?"It's a draw!":s.winner===player?"You won! 🎉":"You lost. Play again!");
  else if(selectedGame==="rps"&&s.moves?.[1]&&s.moves?.[2])status("Both moves locked. Round result below.");
  else status(currentTurn(s));
  if(selectedGame==="tictactoe")drawTtt(board,s);
  if(selectedGame==="connect4")drawConnect(board,s);
  if(selectedGame==="rps")drawRps(board,s);
  if(selectedGame==="dots")drawDots(board,s);
  if(selectedGame==="battleship")drawBattleship(board,s);
}
function drawTtt(root,s){
  const grid=el("div","game-board ttt");s.board.forEach((v,i)=>{const b=cell(v||"");b.classList.toggle("gold",v==="X");b.classList.toggle("blue",v==="O");b.disabled=!!v||s.winner||s.turn!==player||!roomData.players?.[2];b.onclick=()=>moveTtt(i);grid.append(b);});root.append(grid);
}
async function moveTtt(i){
  await runTransaction(ref(db,`rooms/${roomId}/state`),cur=>{if(!cur||cur.winner||cur.turn!==player||cur.board[i])return;cur.board[i]=player===1?"X":"O";const w=isWinnerTtt(cur.board);if(w)cur.winner=w==="draw"?"draw":w==="X"?1:2;else cur.turn=player===1?2:1;return cur;});
}
function drawConnect(root,s){
  const grid=el("div","game-board connect");for(let i=0;i<42;i++){let v=s.board[i];const b=cell(v===1?"🔴":v===2?"🟡":"");b.classList.toggle("red",v===1);b.classList.toggle("yellow",v===2);b.disabled=!!v||s.winner||s.turn!==player||!roomData.players?.[2];b.onclick=()=>moveConnect(i%7);grid.append(b);}root.append(grid);
}
function connectWinner(b){
 for(let r=0;r<6;r++)for(let c=0;c<7;c++){let p=b[r*7+c];if(!p)continue;for(const [dr,dc] of [[0,1],[1,0],[1,1],[1,-1]]){let ok=true;for(let k=1;k<4;k++){let rr=r+dr*k,cc=c+dc*k;if(rr<0||rr>=6||cc<0||cc>=7||b[rr*7+cc]!==p)ok=false;}if(ok)return p;}}
 return b.every(Boolean)?"draw":0;
}
async function moveConnect(col){
 await runTransaction(ref(db,`rooms/${roomId}/state`),cur=>{if(!cur||cur.winner||cur.turn!==player)return;let row=-1;for(let r=5;r>=0;r--)if(!cur.board[r*7+col]){row=r;break;}if(row<0)return;cur.board[row*7+col]=player;let w=connectWinner(cur.board);if(w)cur.winner=w==="draw"?"draw":w;else cur.turn=player===1?2:1;return cur;});
}
const rpsEmoji={Rock:"✊",Paper:"✋",Scissors:"✌"};
function drawRps(root,s){
 const wrap=el("div","");const picks=el("div","rps-picks");
 for(const m of ["Rock","Paper","Scissors"]){let b=document.createElement("button");b.textContent=rpsEmoji[m];b.title=m;b.disabled=!!s.moves?.[player]||!!s.winner||!roomData.players?.[2];b.onclick=()=>moveRps(m);picks.append(b);}
 wrap.append(picks);
 const p1=s.moves?.[1],p2=s.moves?.[2];if(p1&&p2){let result=rpsResult(p1,p2);wrap.append(el("p","score-line",`${rpsEmoji[p1]} ${p1}  ·  ${rpsEmoji[p2]} ${p2} — ${result}`));wrap.append(el("p","score-line",`Score ${s.scores[0]} : ${s.scores[1]} · Round ${s.round}`));}
 root.append(wrap);
}
function rpsResult(a,b){if(a===b)return"Draw";return((a==="Rock"&&b==="Scissors")||(a==="Paper"&&b==="Rock")||(a==="Scissors"&&b==="Paper"))?"Player 1 wins":"Player 2 wins";}
async function moveRps(m){
 await runTransaction(ref(db,`rooms/${roomId}/state`),cur=>{if(!cur||cur.winner||cur.moves?.[player])return;cur.moves={...(cur.moves||{}),[player]:m};if(cur.moves[1]&&cur.moves[2]){let r=rpsResult(cur.moves[1],cur.moves[2]);if(r!=="Draw")cur.scores[r==="Player 1 wins"?0:1]++;if(cur.scores.some(x=>x>=3))cur.winner=cur.scores[0]===cur.scores[1]?"draw":cur.scores[0]>cur.scores[1]?1:2;}return cur;});
}
function drawDots(root,s){
 const grid=el("div","game-board dots");
 // 4x4 dots, 3x3 boxes; edge key H-r-c / V-r-c
 for(let r=0;r<7;r++){for(let c=0;c<7;c++){
  if(r%2===0&&c%2===0){grid.append(cell("•","dot"));}
  else if(r%2===0){let key=`H-${r/2}-${(c-1)/2}`;let b=cell("");b.classList.add("edge");if(s.edges?.[key])b.classList.add("active");b.disabled=!!s.edges?.[key]||s.winner||s.turn!==player||!roomData.players?.[2];b.onclick=()=>moveDots(key);grid.append(b);}
  else if(c%2===0){let key=`V-${(r-1)/2}-${c/2}`;let b=cell("");b.classList.add("edge");if(s.edges?.[key])b.classList.add("active");b.disabled=!!s.edges?.[key]||s.winner||s.turn!==player||!roomData.players?.[2];b.onclick=()=>moveDots(key);grid.append(b);}
  else {let key=`${(r-1)/2}-${(c-1)/2}`;let b=cell("");b.classList.add("box");if(s.boxes?.[key]){b.classList.add("mine");b.textContent=s.boxes[key]===1?"1":"2";}b.disabled=true;grid.append(b);}
 }}
 root.append(grid);root.append(el("p","score-line",`Boxes: ${Object.values(s.boxes||{}).filter(x=>x===1).length} : ${Object.values(s.boxes||{}).filter(x=>x===2).length}`));
}
function boxEdges(r,c){return [`H-${r}-${c}`,`H-${r+1}-${c}`,`V-${r}-${c}`,`V-${r}-${c+1}`];}
async function moveDots(key){
 await runTransaction(ref(db,`rooms/${roomId}/state`),cur=>{if(!cur||cur.winner||cur.turn!==player||cur.edges?.[key])return;cur.edges={...(cur.edges||{}),[key]:player};let scored=false;for(let r=0;r<3;r++)for(let c=0;c<3;c++){let id=`${r}-${c}`;if(!cur.boxes?.[id]&&boxEdges(r,c).every(k=>cur.edges[k])){cur.boxes={...(cur.boxes||{}),[id]:player};scored=true;}}let count=Object.keys(cur.boxes||{}).length;if(count===9)cur.winner=Object.values(cur.boxes).filter(x=>x===1).length===Object.values(cur.boxes).filter(x=>x===2).length?"draw":Object.values(cur.boxes).filter(x=>x===1).length>Object.values(cur.boxes).filter(x=>x===2).length?1:2;else if(!scored)cur.turn=player===1?2:1;return cur;});
}
function drawBattleship(root,s){
 const wrap=el("div","");const hint=el("p","score-line",player===1?"Your fleet: click 3 cells to place ships, then Ready.":"Your fleet: click 3 cells to place ships, then Ready.");wrap.append(hint);
 const grid=el("div","game-board battle-grid");for(let i=0;i<36;i++){let own=s.ships?.[player]?.includes(i),shot=s.shots?.[player===1?2:1]?.[i];let b=cell(own?"🚢":shot?(shot==="hit"?"✕":"·"):"");b.classList.toggle("gold",own);b.classList.toggle("blue",shot==="hit");b.disabled=!!s.ready?.[player]||!!s.winner||!roomData.players?.[2];b.onclick=()=>placeOrShoot(i);grid.append(b);}wrap.append(grid);
 let ready=document.createElement("button");ready.className="secondary-btn";ready.textContent=s.ready?.[player]?"Fleet ready ✓":"Ready (3 ships)";ready.disabled=!!s.ready?.[player]||!(s.ships?.[player]?.length===3);ready.onclick=()=>setReady();wrap.append(ready);
 root.append(wrap);
}
async function placeOrShoot(i) {
  await runTransaction(ref(db, `rooms/${roomId}/state`), cur => {
    if (!cur || cur.winner) return;

    let ships = cur.ships?.[player] || [];

    // Place ships
    if (!cur.ready?.[player]) {
      if (ships.length < 3 && !ships.includes(i)) {
        cur.ships = {
          ...(cur.ships || {}),
          [player]: [...ships, i]
        };
      }
      return cur;
    }

    // Shoot opponent
    if (cur.turn !== player) return;

    let opp = player === 1 ? 2 : 1;

    if (cur.shots?.[opp]?.[i]) return;

    let hit = (cur.ships?.[opp] || []).includes(i);

    cur.shots = {
      ...(cur.shots || {}),
      [opp]: {
        ...(cur.shots?.[opp] || {}),
        [i]: hit ? "hit" : "miss"
      }
    };

    let hits = Object.values(cur.shots[opp])
      .filter(x => x === "hit").length;

    if (hits >= 3) {
      cur.winner = player;
    } else {
      cur.turn = opp;
    }

    return cur;
  });
}
async function setReady(){await update(ref(db,`rooms/${roomId}/state/ready`),{[player]:true});}
function el(tag,cls,text){let e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=text;return e;}
function cell(text){return el("button","cell",text);}
async function resetGame(){
 if(!roomRef||!roomData)return;
 await runTransaction(ref(db,`rooms/${roomId}/state`),cur=>{if(!cur)return;return initialState(selectedGame);});
}
function leave(){if(unsubscribe)unsubscribe();unsubscribe=null;roomId="";roomRef=null;roomData=null;showScreen("home");}
document.querySelectorAll(".game-card").forEach(b=>b.addEventListener("click",()=>createRoom(b.dataset.game)));
$("backBtn").onclick=leave;$("leaveBtn").onclick=leave;$("rematchBtn").onclick=resetGame;
$("copyBtn").onclick=async()=>{try{await navigator.clipboard.writeText(getRoomUrl());toast("Invite link copied!");}catch{toast("Copy this link: "+getRoomUrl());}};
$("joinBackBtn").onclick=()=>showScreen("home");
$("joinRoomBtn").onclick=()=>joinRoom($("joinCodeInput").value);
$("joinCodeInput").addEventListener("keydown",e=>{if(e.key==="Enter")joinRoom($("joinCodeInput").value);});
if(urlRoom){showScreen("join");$("joinCodeInput").value=cleanCode(urlRoom);setTimeout(()=>joinRoom(urlRoom),150);}
