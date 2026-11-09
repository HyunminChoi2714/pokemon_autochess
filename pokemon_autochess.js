/**
 * 포켓몬 오토체스 (Pokemon Auto Chess) Core Engine & UI
 * JavaScript 단일 / 모듈형 통합 파일
 */

// ==========================================
// 1. 포켓몬 데이터베이스 (Evolution & Stats)
// ==========================================
const POKEMON_DB = {
    // 불 타입 (Fire): 공격력 특화
    '파이리': { name: '파이리', tier: 1, cost: 1, type: '불꽃', hp: 120, maxHp: 120, atk: 25, range: 1, next: '리자드', icon: '🔥' },
    '리자드': { name: '리자드', tier: 2, cost: 3, type: '불꽃', hp: 280, maxHp: 280, atk: 55, range: 1, next: '리자몽', icon: '🔥' },
    '리자몽': { name: '리자몽', tier: 3, cost: 9, type: '불꽃', hp: 600, maxHp: 600, atk: 120, range: 2, next: null, icon: '🐲' },

    // 물 타입 (Water): 체력/방어 특화
    '꼬부기': { name: '꼬부기', tier: 1, cost: 1, type: '물', hp: 160, maxHp: 160, atk: 15, range: 1, next: '어니부기', icon: '💧' },
    '어니부기': { name: '어니부기', tier: 2, cost: 3, type: '물', hp: 360, maxHp: 360, atk: 35, range: 1, next: '거북왕', icon: '💧' },
    '거북왕': { name: '거북왕', tier: 3, cost: 9, type: '물', hp: 800, maxHp: 800, atk: 75, range: 2, next: null, icon: '🐢' },

    // 풀 타입 (Grass): 사거리/지속딜
    '이상해씨': { name: '이상해씨', tier: 1, cost: 1, type: '풀', hp: 130, maxHp: 130, atk: 18, range: 2, next: '이상해풀', icon: '🌿' },
    '이상해풀': { name: '이상해풀', tier: 2, cost: 3, type: '풀', hp: 300, maxHp: 300, atk: 40, range: 2, next: '이상해꽃', icon: '🌿' },
    '이상해꽃': { name: '이상해꽃', tier: 3, cost: 9, type: '풀', hp: 650, maxHp: 650, atk: 90, range: 3, next: null, icon: '🌺' },

    // 전기 타입 (Electric): 빠른 공격속도/높은 딜
    '피츄': { name: '피츄', tier: 1, cost: 1, type: '전기', hp: 90, maxHp: 90, atk: 30, range: 2, next: '피카츄', icon: '⚡' },
    '피카츄': { name: '피카츄', tier: 2, cost: 3, type: '전기', hp: 220, maxHp: 220, atk: 70, range: 2, next: '라이츄', icon: '⚡' },
    '라이츄': { name: '라이츄', tier: 3, cost: 9, type: '전기', hp: 500, maxHp: 500, atk: 140, range: 3, next: null, icon: '⚡' },

    // 고스트 타입 (Ghost): 기습/강한 한방
    '고스통': { name: '고스통', tier: 1, cost: 2, type: '고스트', hp: 100, maxHp: 100, atk: 35, range: 2, next: '고우스트', icon: '👻' },
    '고우스트': { name: '고우스트', tier: 2, cost: 4, type: '고스트', hp: 240, maxHp: 240, atk: 80, range: 2, next: '팬텀', icon: '👻' },
    '팬텀': { name: '팬텀', tier: 3, cost: 10, type: '고스트', hp: 520, maxHp: 520, atk: 160, range: 3, next: null, icon: '👿' }
};

const BASE_POKEMON_POOL = ['파이리', '꼬부기', '이상해씨', '피츄', '고스통'];

// ==========================================
// 2. 게임 상태 관리 클래스 (PokemonAutoChess)
// ==========================================
class PokemonAutoChess {
    constructor() {
        this.playerHp = 100;
        this.gold = 10;
        this.level = 1;
        this.xp = 0;
        this.round = 1;
        this.phase = 'PREPARE'; // 'PREPARE' | 'BATTLE'

        this.bench = new Array(8).fill(null); // 대기석 8칸
        this.board = Array.from({ length: 4 }, () => new Array(4).fill(null)); // 플레이어 전장 (4x4)
        this.enemyBoard = Array.from({ length: 4 }, () => new Array(4).fill(null)); // 적 전장 (4x4)
        this.shop = [];

        this.selectedUnit = null; // 선택된 포켓몬 { source: 'bench'|'board', index/row, col }
        this.battleTimer = null;
        this.battleUnits = []; // 전투 중 단위 객체 관리

        this.init();
    }

    init() {
        this.rerollShop(true);
        this.render();
        this.log("🎮 포켓몬 오토체스 게임에 오신 것을 환영합니다! 포켓몬을 구매하여 배치하세요.");
    }

    // 포켓몬 인스턴스 생성
    createPokemon(name, isEnemy = false) {
        const base = POKEMON_DB[name];
        if (!base) return null;
        return {
            id: Math.random().toString(36).substr(2, 9),
            name: base.name,
            tier: base.tier,
            cost: base.cost,
            type: base.type,
            hp: base.hp,
            maxHp: base.maxHp,
            atk: base.atk,
            range: base.range,
            icon: base.icon,
            isEnemy: isEnemy,
            x: 0,
            y: 0
        };
    }

    // 상점 리롤
    rerollShop(free = false) {
        if (!free) {
            if (this.gold < 2) {
                this.log("⚠️ 골드가 부족합니다! (상점 리롤에는 2골드가 필요합니다)");
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

    // 상점에서 구매
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

        // 3마리 진화 체크
        this.checkEvolution();
        this.render();
    }

    // 포켓몬 판매
    sellPokemon(source, idx, r, c) {
        if (this.phase !== 'PREPARE') return;
        let unit = null;
        if (source === 'bench') {
            unit = this.bench[idx];
            this.bench[idx] = null;
        } else if (source === 'board') {
            unit = this.board[r][c];
            this.board[r][c] = null;
        }

        if (unit) {
            const refund = unit.cost;
            this.gold += refund;
            this.log(`💰 ${unit.name}(을)를 판매하여 ${refund} 골드를 얻었습니다.`);
            this.render();
        }
    }

    // 🌟 핵심 메커니즘: 3마리 포켓몬 자동 진화 (Triple Combine Evolution)
    checkEvolution() {
        let evolvedAny = false;

        // 보유 중인 모든 포켓몬 수집 (대기석 + 필드)
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

        // 각 포켓몬 종별로 3마리 이상인지 검사
        for (const name in counts) {
            const list = counts[name];
            const nextEvoName = POKEMON_DB[name]?.next;

            if (list.length >= 3 && nextEvoName) {
                // 3마리 제거 (대기석 우선 제거, 그 다음 필드)
                const targetUnits = list.slice(0, 3);
                let targetSlot = { source: targetUnits[0].source, r: targetUnits[0].r, c: targetUnits[0].c };

                targetUnits.forEach(item => {
                    if (item.source === 'bench') {
                        this.bench[item.c] = null;
                    } else {
                        this.board[item.r][item.c] = null;
                    }
                });

                // 진화체 생성 및 슬롯 배치
                const evolvedUnit = this.createPokemon(nextEvoName);
                if (targetSlot.source === 'board') {
                    this.board[targetSlot.r][targetSlot.c] = evolvedUnit;
                } else {
                    const emptyBench = this.bench.findIndex(slot => slot === null);
                    if (emptyBench !== -1) {
                        this.bench[emptyBench] = evolvedUnit;
                    } else {
                        // 대기석 없으면 빈 필드 검색
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
                break; // 한 번 진화 후 연쇄 진화(Chain Evolution)를 위해 반복 재귀 실행
            }
        }

        if (evolvedAny) {
            this.checkEvolution();
        }
    }

    // 경험치 구매 및 레벨업
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
            this.log(`🎉 레벨 업! 레벨 ${this.level}에 도달했습니다. (최대 배치 가능 수: ${this.level})`);
        } else {
            this.log(`📘 경험치를 구매했습니다 (+4 XP).`);
        }
        this.render();
    }

    // 현재 배치된 포켓몬 수
    getBoardUnitCount() {
        let count = 0;
        for (let r = 0; r < 4; r++) {
            for (let c = 0; c < 4; c++) {
                if (this.board[r][c]) count++;
            }
        }
        return count;
    }

    // 슬롯 클릭 (이동 및 배치)
    handleSlotClick(type, r, c) {
        if (this.phase !== 'PREPARE') return;

        if (!this.selectedUnit) {
            // 선택
            if (type === 'bench' && this.bench[c]) {
                this.selectedUnit = { type: 'bench', index: c, unit: this.bench[c] };
            } else if (type === 'board' && this.board[r][c]) {
                this.selectedUnit = { type: 'board', r, c, unit: this.board[r][c] };
            }
        } else {
            // 이동 / 위치 교체
            const sel = this.selectedUnit;

            // 동일 슬롯 클릭 시 취소
            if (sel.type === type && (sel.index === c || (sel.r === r && sel.c === c))) {
                this.selectedUnit = null;
                this.render();
                return;
            }

            // 필드로 새로 배치할 때 배치 제한(Level) 검사
            if (sel.type === 'bench' && type === 'board' && !this.board[r][c]) {
                if (this.getBoardUnitCount() >= this.level) {
                    this.log(`⚠️ 현재 레벨(${this.level})에서는 더 이상 포켓몬을 필드에 올릴 수 없습니다!`);
                    this.selectedUnit = null;
                    this.render();
                    return;
                }
            }

            // 슬롯 교체 실행
            let targetUnit = null;
            if (type === 'bench') targetUnit = this.bench[c];
            else if (type === 'board') targetUnit = this.board[r][c];

            // 출처 슬롯 세팅
            if (sel.type === 'bench') this.bench[sel.index] = targetUnit;
            else if (sel.type === 'board') this.board[sel.r][sel.c] = targetUnit;

            // 목적지 슬롯 세팅
            if (type === 'bench') this.bench[c] = sel.unit;
            else if (type === 'board') this.board[r][c] = sel.unit;

            this.selectedUnit = null;
            this.render();
        }
    }

    // 전투 시작
    startBattle() {
        if (this.phase !== 'PREPARE') return;
        if (this.getBoardUnitCount() === 0) {
            this.log("⚠️ 전장에 포켓몬이 최소 1마리 이상 배치되어야 전투를 시작할 수 있습니다!");
            return;
        }

        this.phase = 'BATTLE';
        this.log(`⚔️ Round ${this.round} 전투가 시작되었습니다!`);

        // 적군 자동 생성
        this.generateEnemies();

        // 시뮬레이션용 전투 유닛 리스트 작성
        this.battleUnits = [];
        for (let r = 0; r < 4; r++) {
            for (let c = 0; c < 4; c++) {
                if (this.board[r][c]) {
                    const u = JSON.parse(JSON.stringify(this.board[r][c]));
                    u.gridX = c;
                    u.gridY = r + 4; // 아군은 아래쪽 4행
                    this.battleUnits.push(u);
                }
                if (this.enemyBoard[r][c]) {
                    const u = JSON.parse(JSON.stringify(this.enemyBoard[r][c]));
                    u.gridX = c;
                    u.gridY = r; // 적군은 위쪽 4행
                    this.battleUnits.push(u);
                }
            }
        }

        this.render();

        // 1초 주기로 실시간 자동 전투 진행
        this.battleTimer = setInterval(() => this.battleStep(), 1000);
    }

    // 적 생성 알고리즘
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

    // 전투 한 턴 진행
    battleStep() {
        const playerUnits = this.battleUnits.filter(u => !u.isEnemy && u.hp > 0);
        const enemyUnits = this.battleUnits.filter(u => u.isEnemy && u.hp > 0);

        // 승패 판단
        if (playerUnits.length === 0 || enemyUnits.length === 0) {
            this.endBattle(playerUnits.length > 0);
            return;
        }

        // 각 살아있는 유닛 행동
        this.battleUnits.forEach(unit => {
            if (unit.hp <= 0) return;

            const targets = this.battleUnits.filter(t => t.isEnemy !== unit.isEnemy && t.hp > 0);
            if (targets.length === 0) return;

            // 가장 가까운 적 찾기
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
                    // 공격
                    closest.hp -= unit.atk;
                    this.log(`💥 [${unit.name}]이(가) [${closest.name}]에게 ${unit.atk} 데미지를 입혔습니다! (남은 HP: ${Math.max(0, closest.hp)})`);
                } else {
                    // 이동 (적 방향으로 1칸)
                    if (unit.gridX < closest.gridX) unit.gridX++;
                    else if (unit.gridX > closest.gridX) unit.gridX--;
                    else if (unit.gridY < closest.gridY) unit.gridY++;
                    else if (unit.gridY > closest.gridY) unit.gridY--;
                }
            }
        });

        this.render();
    }

    // 전투 종료 처리
    endBattle(isWin) {
        clearInterval(this.battleTimer);
        this.battleTimer = null;
        this.phase = 'PREPARE';

        if (isWin) {
            this.log(`🏆 Round ${this.round} 승리! +5 Gold 수령`);
            this.gold += 5 + Math.floor(this.gold * 0.1); // 기본 5g + 이자
        } else {
            const damage = 5 + this.round;
            this.playerHp -= damage;
            this.log(`💀 Round ${this.round} 패배! 체력이 ${damage} 감소했습니다.`);
            this.gold += 5; // 패배 지원금
        }

        if (this.playerHp <= 0) {
            this.playerHp = 0;
            this.log("☠️ 게임 오버! 체력이 0이 되었습니다.");
            alert("게임 오버! 페이지를 새로고침하여 재기동하세요.");
            return;
        }

        this.round++;
        this.rerollShop(true);
        this.render();
    }

    // 시너지 계산 (타입별 조합 효과)
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

    // 로그 출력
    log(msg) {
        const logBox = document.getElementById('log-box');
        if (logBox) {
            const p = document.createElement('p');
            p.textContent = msg;
            logBox.appendChild(p);
            logBox.scrollTop = logBox.scrollHeight;
        }
    }

    // UI 렌더링
    render() {
        // 상단 정보 업데이트
        document.getElementById('player-hp').textContent = this.playerHp;
        document.getElementById('player-gold').textContent = this.gold;
        document.getElementById('player-level').textContent = this.level;
        document.getElementById('player-xp').textContent = `${this.xp}/${this.level * 4}`;
        document.getElementById('round-num').textContent = this.round;
        document.getElementById('unit-count').textContent = `${this.getBoardUnitCount()}/${this.level}`;

        // 시너지 렌더링
        const synBox = document.getElementById('synergy-list');
        if (synBox) {
            const syns = this.calculateSynergies();
            synBox.innerHTML = Object.keys(syns).length === 0 ? '<span style="color:#888;">활성 시너지 없음</span>' : '';
            for (const [type, count] of Object.entries(syns)) {
                synBox.innerHTML += `<div class="syn-badge">${type} (${count})</div>`;
            }
        }

        // 상점 렌더링
        const shopContainer = document.getElementById('shop-container');
        if (shopContainer) {
            shopContainer.innerHTML = '';
            this.shop.forEach((unit, idx) => {
                const card = document.createElement('div');
                card.className = `shop-card ${!unit ? 'disabled' : ''}`;
                if (unit) {
                    card.innerHTML = `
                        <div class="unit-icon">${unit.icon}</div>
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

        // 대기석(Bench) 렌더링
        const benchContainer = document.getElementById('bench-container');
        if (benchContainer) {
            benchContainer.innerHTML = '';
            this.bench.forEach((unit, idx) => {
                const slot = document.createElement('div');
                const isSelected = this.selectedUnit?.type === 'bench' && this.selectedUnit?.index === idx;
                slot.className = `slot bench-slot ${isSelected ? 'selected' : ''}`;
                if (unit) {
                    slot.innerHTML = `
                        <span class="icon">${unit.icon}</span>
                        <span class="name">${unit.name}</span>
                        <span class="stars">${'★'.repeat(unit.tier)}</span>
                    `;
                }
                slot.onclick = () => this.handleSlotClick('bench', null, idx);
                benchContainer.appendChild(slot);
            });
        }

        // 전장(Board) 렌더링 - 적 / 플레이어 통합 8x4 Grid
        const boardGrid = document.getElementById('board-grid');
        if (boardGrid) {
            boardGrid.innerHTML = '';

            if (this.phase === 'BATTLE') {
                // 전투 중 상태 렌더링 (8x4 grid)
                for (let r = 0; r < 8; r++) {
                    for (let c = 0; c < 4; c++) {
                        const cell = document.createElement('div');
                        cell.className = `grid-cell battle-cell ${r < 4 ? 'enemy-area' : 'player-area'}`;
                        const unit = this.battleUnits.find(u => u.gridY === r && u.gridX === c && u.hp > 0);
                        if (unit) {
                            const hpPercent = Math.max(0, Math.floor((unit.hp / unit.maxHp) * 100));
                            cell.innerHTML = `
                                <div class="unit-icon">${unit.icon}</div>
                                <div class="unit-name">${unit.name}</div>
                                <div class="hp-bar-bg"><div class="hp-bar-fg" style="width:${hpPercent}%"></div></div>
                            `;
                        }
                        boardGrid.appendChild(cell);
                    }
                }
            } else {
                // 준비 단계 렌더링 (적전장 4x4 + 플레이어전장 4x4)
                for (let r = 0; r < 4; r++) {
                    for (let c = 0; c < 4; c++) {
                        const cell = document.createElement('div');
                        cell.className = 'grid-cell enemy-cell';
                        const enemy = this.enemyBoard[r][c];
                        if (enemy) {
                            cell.innerHTML = `<span class="icon">${enemy.icon}</span><span class="name">${enemy.name}</span>`;
                        }
                        boardGrid.appendChild(cell);
                    }
                }
                for (let r = 0; r < 4; r++) {
                    for (let c = 0; c < 4; c++) {
                        const cell = document.createElement('div');
                        const isSelected = this.selectedUnit?.type === 'board' && this.selectedUnit?.r === r && this.selectedUnit?.c === c;
                        cell.className = `grid-cell player-cell ${isSelected ? 'selected' : ''}`;
                        const unit = this.board[r][c];
                        if (unit) {
                            cell.innerHTML = `
                                <span class="icon">${unit.icon}</span>
                                <span class="name">${unit.name}</span>
                                <span class="stars">${'★'.repeat(unit.tier)}</span>
                            `;
                        }
                        cell.onclick = () => this.handleSlotClick('board', r, c);
                        boardGrid.appendChild(cell);
                    }
                }
            }
        }
    }
}

// 글로벌 인스턴스 초기화
let game;
window.onload = () => {
    game = new PokemonAutoChess();
};
