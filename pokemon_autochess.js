/**
 * 포켓몬 오토체스 (Pokemon Auto Chess) Core Engine & UI
 */

const POKEMON_DB = {
    // 불 타입 (Fire)
    '파이리': { id: 4, name: '파이리', tier: 1, cost: 1, type: '불꽃', hp: 120, maxHp: 120, atk: 25, range: 1, next: '리자드' },
    '리자드': { id: 5, name: '리자드', tier: 2, cost: 3, type: '불꽃', hp: 280, maxHp: 280, atk: 55, range: 1, next: '리자몽' },
    '리자몽': { id: 6, name: '리자몽', tier: 3, cost: 9, type: '불꽃', hp: 600, maxHp: 600, atk: 120, range: 2, next: null },

    // 물 타입 (Water)
    '꼬부기': { id: 7, name: '꼬부기', tier: 1, cost: 1, type: '물', hp: 160, maxHp: 160, atk: 15, range: 1, next: '어니부기' },
    '어니부기': { id: 8, name: '어니부기', tier: 2, cost: 3, type: '물', hp: 360, maxHp: 360, atk: 35, range: 1, next: '거북왕' },
    '거북왕': { id: 9, name: '거북왕', tier: 3, cost: 9, type: '물', hp: 800, maxHp: 800, atk: 75, range: 2, next: null },

    // 풀 타입 (Grass)
    '이상해씨': { id: 1, name: '이상해씨', tier: 1, cost: 1, type: '풀', hp: 130, maxHp: 130, atk: 18, range: 2, next: '이상해풀' },
    '이상해풀': { id: 2, name: '이상해풀', tier: 2, cost: 3, type: '풀', hp: 300, maxHp: 300, atk: 40, range: 2, next: '이상해꽃' },
    '이상해꽃': { id: 3, name: '이상해꽃', tier: 3, cost: 9, type: '풀', hp: 650, maxHp: 650, atk: 90, range: 3, next: null },

    // 전기 타입 (Electric)
    '피츄': { id: 172, name: '피츄', tier: 1, cost: 1, type: '전기', hp: 90, maxHp: 90, atk: 30, range: 2, next: '피카츄' },
    '피카츄': { id: 25, name: '피카츄', tier: 2, cost: 3, type: '전기', hp: 220, maxHp: 220, atk: 70, range: 2, next: '라이츄' },
    '라이츄': { id: 26, name: '라이츄', tier: 3, cost: 9, type: '전기', hp: 500, maxHp: 500, atk: 140, range: 3, next: null },

    // 고스트 타입 (Ghost)
    '고스통': { id: 92, name: '고스통', tier: 1, cost: 2, type: '고스트', hp: 100, maxHp: 100, atk: 35, range: 2, next: '고우스트' },
    '고우스트': { id: 93, name: '고우스트', tier: 2, cost: 4, type: '고스트', hp: 240, maxHp: 240, atk: 80, range: 2, next: '팬텀' },
    '팬텀': { id: 94, name: '팬텀', tier: 3, cost: 10, type: '고스트', hp: 520, maxHp: 520, atk: 160, range: 3, next: null }
};

const BASE_POKEMON_POOL = ['파이리', '꼬부기', '이상해씨', '피츄', '고스통'];

function getPokemonImgUrl(pokedexId) {
    return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokedexId}.png`;
}

class PokemonAutoChess {
    constructor() {
        this.playerHp = 100;
        this.gold = 10;
        this.level = 1;
        this.xp = 0;
        this.round = 1;
        this.phase = 'PREPARE';

        this.bench = new Array(8).fill(null);
        this.board = Array.from({ length: 4 }, () => new Array(4).fill(null));
        this.enemyBoard = Array.from({ length: 4 }, () => new Array(4).fill(null));
        this.shop = [];

        this.selectedUnit = null;
        this.battleTimer = null;
        this.battleUnits = [];

        this.init();
    }

    init() {
        this.rerollShop(true);
        this.render();
        this.log("🎮 포켓몬 오토체스에 오신 것을 환영합니다! 포켓몬을 구매하고 필드에 배치하세요.");
    }

    createPokemon(name, isEnemy = false) {
        const base = POKEMON_DB[name];
        if (!base) return null;
        return {
            uid: Math.random().toString(36).substr(2, 9),
            pokedexId: base.id,
            name: base.name,
            tier: base.tier,
            cost: base.cost,
            type: base.type,
            hp: base.hp,
            maxHp: base.maxHp,
            atk: base.atk,
            range: base.range,
            img: getPokemonImgUrl(base.id),
            isEnemy: isEnemy,
            gridX: 0,
            gridY: 0
        };
    }

    rerollShop(free = false) {
        if (!free) {
            if (this.gold < 2) {
                this.log("⚠️ 골드가 부족합니다! (상점 리롤: 2골드)");
                return;
            }
            this.gold -= 2;
        }
        this.shop = [];
        for (let i = 0; i < 5; i++) {
            const randomName = BASE_POKEMON_POOL[Math.floor(Math.random() * BASE_POKEMON_POOL.length)];
            this.shop.push(this.createPokemon(randomName));
        }
        this.render();
    }

    buyPokemon(index) {
        if (this.phase !== 'PREPARE') return;
        const unit = this.shop[index];
        if (!unit) return;

        if (this.gold < unit.cost) {
            this.log("⚠️ 골드가 부족하여 구매할 수 없습니다!");
            return;
        }

        const emptyBenchIdx = this.bench.findIndex(slot => slot === null);
        if (emptyBenchIdx === -1) {
            this.log("⚠️ 대기석이 가득 찼습니다!");
            return;
        }

        this.gold -= unit.cost;
        this.bench[emptyBenchIdx] = unit;
        this.shop[index] = null;
        this.log(`🛒 ${unit.name}(을)를 구매하여 대기석에 배치했습니다.`);

        this.checkEvolution();
        this.render();
    }

    checkEvolution() {
        let evolvedAny = false;

        const counts = {};
        const collectUnits = (source, r, c, unit) => {
            if (!unit) return;
            if (!counts[unit.name]) counts[unit.name] = [];
            counts[unit.name].push({ source, r, c, unit });
        };

        this.bench.forEach((u, i) => collectUnits('bench', null, i, u));
        for (let r = 0; r < 4; r++) {
            for (let c = 0; c < 4; c++) {
                collectUnits('board', r, c, this.board[r][c]);
            }
        }

        for (const name in counts) {
            const list = counts[name];
            const nextEvoName = POKEMON_DB[name]?.next;

            if (list.length >= 3 && nextEvoName) {
                const targetUnits = list.slice(0, 3);
                let targetSlot = { source: targetUnits[0].source, r: targetUnits[0].r, c: targetUnits[0].c };

                targetUnits.forEach(item => {
                    if (item.source === 'bench') {
                        this.bench[item.c] = null;
                    } else {
                        this.board[item.r][item.c] = null;
                    }
                });

                const evolvedUnit = this.createPokemon(nextEvoName);
                if (targetSlot.source === 'board') {
                    this.board[targetSlot.r][targetSlot.c] = evolvedUnit;
                } else {
                    const emptyBench = this.bench.findIndex(slot => slot === null);
                    if (emptyBench !== -1) {
                        this.bench[emptyBench] = evolvedUnit;
                    } else {
                        let placed = false;
                        for (let r = 0; r < 4; r++) {
                            for (let c = 0; c < 4; c++) {
                                if (!this.board[r][c]) {
                                    this.board[r][c] = evolvedUnit;
                                    placed = true;
                                    break;
                                }
                            }
                            if (placed) break;
                        }
                    }
                }

                this.log(`✨ 3마리의 ${name}(이)가 결합하여 🌟 ${nextEvoName}(으)로 진화했습니다!`);
                evolvedAny = true;
                break;
            }
        }

        if (evolvedAny) {
            this.checkEvolution();
        }
    }

    buyXp() {
        if (this.gold < 4) {
            this.log("⚠️ 골드가 부족합니다! (4골드 필요)");
            return;
        }
        this.gold -= 4;
        this.xp += 4;
        if (this.xp >= this.level * 4 && this.level < 8) {
            this.xp -= this.level * 4;
            this.level++;
            this.log(`🎉 레벨 업! 레벨 ${this.level} (최대 배치 가능 수: ${this.level})`);
        } else {
            this.log(`📘 경험치 구매 (+4 XP).`);
        }
        this.render();
    }

    getBoardUnitCount() {
        let count = 0;
        for (let r = 0; r < 4; r++) {
            for (let c = 0; c < 4; c++) {
                if (this.board[r][c]) count++;
            }
        }
        return count;
    }

    handleSlotClick(type, r, c) {
        if (this.phase !== 'PREPARE') return;

        if (!this.selectedUnit) {
            if (type === 'bench' && this.bench[c]) {
                this.selectedUnit = { type: 'bench', index: c, unit: this.bench[c] };
                this.log(`📌 대기석의 [${this.bench[c].name}] 선택됨. 배치할 위치를 클릭하세요.`);
                this.render();
            } else if (type === 'board' && this.board[r][c]) {
                this.selectedUnit = { type: 'board', r, c, unit: this.board[r][c] };
                this.log(`📌 필드의 [${this.board[r][c].name}] 선택됨. 이동할 위치를 클릭하세요.`);
                this.render();
            }
            return;
        }

        const sel = this.selectedUnit;

        if (sel.type === type && (sel.index === c || (sel.r === r && sel.c === c))) {
            this.selectedUnit = null;
            this.render();
            return;
        }

        if (sel.type === 'bench' && type === 'board' && !this.board[r][c]) {
            if (this.getBoardUnitCount() >= this.level) {
                this.log(`⚠️ 현재 레벨(${this.level})에서는 최대 ${this.level}마리까지만 필드에 배치할 수 있습니다!`);
                this.selectedUnit = null;
                this.render();
                return;
            }
        }

        let targetUnit = (type === 'bench') ? this.bench[c] : this.board[r][c];

        if (sel.type === 'bench') {
            this.bench[sel.index] = targetUnit;
        } else {
            this.board[sel.r][sel.c] = targetUnit;
        }

        if (type === 'bench') {
            this.bench[c] = sel.unit;
        } else {
            this.board[r][c] = sel.unit;
        }

        this.log(`✨ 포켓몬 위치 이동 완료!`);
        this.selectedUnit = null;

        this.checkEvolution();
        this.render();
    }

    startBattle() {
        if (this.phase !== 'PREPARE') return;
        if (this.getBoardUnitCount() === 0) {
            this.log("⚠️ 전장에 포켓몬이 최소 1마리 이상 배치되어야 전투를 시작할 수 있습니다!");
            return;
        }

        this.selectedUnit = null;
        this.phase = 'BATTLE';
        this.log(`⚔️ Round ${this.round} 전투 시작!`);

        this.generateEnemies();

        this.battleUnits = [];
        for (let r = 0; r < 4; r++) {
            for (let c = 0; c < 4; c++) {
                if (this.board[r][c]) {
                    const u = JSON.parse(JSON.stringify(this.board[r][c]));
                    u.gridX = c;
                    u.gridY = r + 4;
                    this.battleUnits.push(u);
                }
                if (this.enemyBoard[r][c]) {
                    const u = JSON.parse(JSON.stringify(this.enemyBoard[r][c]));
                    u.gridX = c;
                    u.gridY = r;
                    this.battleUnits.push(u);
                }
            }
        }

        this.render();
        this.battleTimer = setInterval(() => this.battleStep(), 1000);
    }

    generateEnemies() {
        this.enemyBoard = Array.from({ length: 4 }, () => new Array(4).fill(null));
        const enemyCount = Math.min(this.round, 6);
        const pool = Object.keys(POKEMON_DB);

        for (let i = 0; i < enemyCount; i++) {
            const randomName = pool[Math.floor(Math.random() * pool.length)];
            const enemyUnit = this.createPokemon(randomName, true);
            const r = Math.floor(Math.random() * 4);
            const c = Math.floor(Math.random() * 4);
            this.enemyBoard[r][c] = enemyUnit;
        }
    }

    battleStep() {
        const playerUnits = this.battleUnits.filter(u => !u.isEnemy && u.hp > 0);
        const enemyUnits = this.battleUnits.filter(u => u.isEnemy && u.hp > 0);

        if (playerUnits.length === 0 || enemyUnits.length === 0) {
            this.endBattle(playerUnits.length > 0);
            return;
        }

        this.battleUnits.forEach(unit => {
            if (unit.hp <= 0) return;

            const targets = this.battleUnits.filter(t => t.isEnemy !== unit.isEnemy && t.hp > 0);
            if (targets.length === 0) return;

            let closest = null;
            let minDist = 999;
            targets.forEach(t => {
                const dist = Math.abs(t.gridX - unit.gridX) + Math.abs(t.gridY - unit.gridY);
                if (dist < minDist) {
                    minDist = dist;
                    closest = t;
                }
            });

            if (closest) {
                if (minDist <= unit.range) {
                    closest.hp -= unit.atk;
                    this.log(`💥 [${unit.name}] -> [${closest.name}] ${unit.atk} 데미지! (남은 HP: ${Math.max(0, closest.hp)})`);
                } else {
                    if (unit.gridX < closest.gridX) unit.gridX++;
                    else if (unit.gridX > closest.gridX) unit.gridX--;
                    else if (unit.gridY < closest.gridY) unit.gridY++;
                    else if (unit.gridY > closest.gridY) unit.gridY--;
                }
            }
        });

        this.render();
    }

    endBattle(isWin) {
        clearInterval(this.battleTimer);
        this.battleTimer = null;
        this.phase = 'PREPARE';

        if (isWin) {
            this.log(`🏆 Round ${this.round} 승리! +5 Gold 수령`);
            this.gold += 5 + Math.floor(this.gold * 0.1);
        } else {
            const damage = 5 + this.round;
            this.playerHp -= damage;
            this.log(`💀 Round ${this.round} 패배! 체력 -${damage}`);
            this.gold += 5;
        }

        if (this.playerHp <= 0) {
            this.playerHp = 0;
            this.log("☠️ 게임 오버! 체력이 0이 되었습니다.");
            alert("게임 오버! 새로고침하여 다시 도전하세요.");
            return;
        }

        this.round++;
        this.rerollShop(true);
        this.render();
    }

    calculateSynergies() {
        const typeCounts = {};
        for (let r = 0; r < 4; r++) {
            for (let c = 0; c < 4; c++) {
                const unit = this.board[r][c];
                if (unit) {
                    typeCounts[unit.type] = (typeCounts[unit.type] || 0) + 1;
                }
            }
        }
        return typeCounts;
    }

    log(msg) {
        const logBox = document.getElementById('log-box');
        if (logBox) {
            const p = document.createElement('p');
            p.textContent = msg;
            logBox.appendChild(p);
            logBox.scrollTop = logBox.scrollHeight;
        }
    }

    render() {
        document.getElementById('player-hp').textContent = this.playerHp;
        document.getElementById('player-gold').textContent = this.gold;
        document.getElementById('player-level').textContent = this.level;
        document.getElementById('player-xp').textContent = `${this.xp}/${this.level * 4}`;
        document.getElementById('round-num').textContent = this.round;
        document.getElementById('unit-count').textContent = `${this.getBoardUnitCount()}/${this.level}`;

        const synBox = document.getElementById('synergy-list');
        if (synBox) {
            const syns = this.calculateSynergies();
            synBox.innerHTML = Object.keys(syns).length === 0 ? '<span style="color:#888;">활성 시너지 없음</span>' : '';
            for (const [type, count] of Object.entries(syns)) {
                synBox.innerHTML += `<div class="syn-badge">${type} (${count})</div>`;
            }
        }

        const shopContainer = document.getElementById('shop-container');
        if (shopContainer) {
            shopContainer.innerHTML = '';
            this.shop.forEach((unit, idx) => {
                const card = document.createElement('div');
                card.className = `shop-card ${!unit ? 'disabled' : ''}`;
                if (unit) {
                    card.innerHTML = `
                        <div class="img-wrapper">
                            <img src="${unit.img}" alt="${unit.name}" class="pokemon-img">
                        </div>
                        <div class="unit-name">${unit.name}</div>
                        <div class="unit-type">${unit.type}</div>
                        <div class="unit-cost">💰 ${unit.cost} G</div>
                    `;
                    card.onclick = () => this.buyPokemon(idx);
                } else {
                    card.innerHTML = `<div class="sold-out">SOLD OUT</div>`;
                }
                shopContainer.appendChild(card);
            });
        }

        const benchContainer = document.getElementById('bench-container');
        if (benchContainer) {
            benchContainer.innerHTML = '';
            this.bench.forEach((unit, idx) => {
                const slot = document.createElement('div');
                const isSelected = this.selectedUnit?.type === 'bench' && this.selectedUnit?.index === idx;
                slot.className = `bench-slot ${isSelected ? 'selected' : ''}`;
                if (unit) {
                    slot.innerHTML = `
                        <img src="${unit.img}" class="slot-pokemon-img" alt="${unit.name}">
                        <span class="name">${unit.name}</span>
                        <span class="stars">${'★'.repeat(unit.tier)}</span>
                    `;
                } else {
                    slot.innerHTML = `<span class="empty-text">빈 슬롯</span>`;
                }
                slot.onclick = () => this.handleSlotClick('bench', null, idx);
                benchContainer.appendChild(slot);
            });
        }

        const enemyBoardGrid = document.getElementById('enemy-board-grid');
        const playerBoardGrid = document.getElementById('player-board-grid');
        const battleBoardGrid = document.getElementById('battle-board-grid');

        const enemyArea = document.getElementById('enemy-area-wrapper');
        const playerArea = document.getElementById('player-area-wrapper');
        const battleArea = document.getElementById('battle-area-wrapper');

        if (this.phase === 'BATTLE') {
            enemyArea.style.display = 'none';
            playerArea.style.display = 'none';
            battleArea.style.display = 'block';

            battleBoardGrid.innerHTML = '';
            for (let r = 0; r < 8; r++) {
                for (let c = 0; c < 4; c++) {
                    const cell = document.createElement('div');
                    cell.className = `grid-cell battle-cell ${r < 4 ? 'enemy-side' : 'player-side'}`;
                    const unit = this.battleUnits.find(u => u.gridY === r && u.gridX === c && u.hp > 0);
                    if (unit) {
                        const hpPercent = Math.max(0, Math.floor((unit.hp / unit.maxHp) * 100));
                        cell.innerHTML = `
                            <img src="${unit.img}" class="slot-pokemon-img" alt="${unit.name}">
                            <div class="unit-name">${unit.name}</div>
                            <div class="hp-bar-bg"><div class="hp-bar-fg" style="width:${hpPercent}%"></div></div>
                        `;
                    }
                    battleBoardGrid.appendChild(cell);
                }
            }
        } else {
            enemyArea.style.display = 'block';
            playerArea.style.display = 'block';
            battleArea.style.display = 'none';

            if (enemyBoardGrid) {
                enemyBoardGrid.innerHTML = '';
                for (let r = 0; r < 4; r++) {
                    for (let c = 0; c < 4; c++) {
                        const cell = document.createElement('div');
                        cell.className = 'grid-cell enemy-cell';
                        const enemy = this.enemyBoard[r][c];
                        if (enemy) {
                            cell.innerHTML = `
                                <img src="${enemy.img}" class="slot-pokemon-img" alt="${enemy.name}">
                                <span class="name">${enemy.name}</span>
                            `;
                        }
                        enemyBoardGrid.appendChild(cell);
                    }
                }
            }

            if (playerBoardGrid) {
                playerBoardGrid.innerHTML = '';
                for (let r = 0; r < 4; r++) {
                    for (let c = 0; c < 4; c++) {
                        const cell = document.createElement('div');
                        const isSelected = this.selectedUnit?.type === 'board' && this.selectedUnit?.r === r && this.selectedUnit?.c === c;
                        cell.className = `grid-cell player-cell ${isSelected ? 'selected' : ''}`;
                        const unit = this.board[r][c];
                        if (unit) {
                            cell.innerHTML = `
                                <img src="${unit.img}" class="slot-pokemon-img" alt="${unit.name}">
                                <span class="name">${unit.name}</span>
                                <span class="stars">${'★'.repeat(unit.tier)}</span>
                            `;
                        }
                        cell.onclick = () => this.handleSlotClick('board', r, c);
                        playerBoardGrid.appendChild(cell);
                    }
                }
            }
        }
    }
}

let game;
window.onload = () => {
    game = new PokemonAutoChess();
};