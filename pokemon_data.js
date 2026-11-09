/**
 * 포켓몬 오토체스 - 포켓몬 데이터베이스 (pokemon_data.js)
 * 새로운 포켓몬을 추가하거나 능력치를 수정할 때 이 파일만 편집하시면 됩니다.
 */

// PokéAPI 공식 일러스트 URL 생성
function getPokemonImgUrl(pokedexId) {
    return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokedexId}.png`;
}

// 1. 포켓몬 도감 데이터베이스 (id: 전국도감 번호, next: 진화할 포켓몬 이름)
const POKEMON_DB = {
    // 🔥 불꽃 타입
    '파이리': { id: 4, name: '파이리', tier: 1, cost: 1, type: '불꽃', hp: 120, maxHp: 120, atk: 25, range: 1, next: '리자드' },
    '리자드': { id: 5, name: '리자드', tier: 2, cost: 3, type: '불꽃', hp: 280, maxHp: 280, atk: 55, range: 1, next: '리자몽' },
    '리자몽': { id: 6, name: '리자몽', tier: 3, cost: 9, type: '불꽃', hp: 600, maxHp: 600, atk: 120, range: 2, next: null },

    // 💧 물 타입
    '꼬부기': { id: 7, name: '꼬부기', tier: 1, cost: 1, type: '물', hp: 160, maxHp: 160, atk: 15, range: 1, next: '어니부기' },
    '어니부기': { id: 8, name: '어니부기', tier: 2, cost: 3, type: '물', hp: 360, maxHp: 360, atk: 35, range: 1, next: '거북왕' },
    '거북왕': { id: 9, name: '거북왕', tier: 3, cost: 9, type: '물', hp: 800, maxHp: 800, atk: 75, range: 2, next: null },

    // 🌿 풀 타입
    '이상해씨': { id: 1, name: '이상해씨', tier: 1, cost: 1, type: '풀', hp: 130, maxHp: 130, atk: 18, range: 2, next: '이상해풀' },
    '이상해풀': { id: 2, name: '이상해풀', tier: 2, cost: 3, type: '풀', hp: 300, maxHp: 300, atk: 40, range: 2, next: '이상해꽃' },
    '이상해꽃': { id: 3, name: '이상해꽃', tier: 3, cost: 9, type: '풀', hp: 650, maxHp: 650, atk: 90, range: 3, next: null },

    // ⚡ 전기 타입
    '피츄': { id: 172, name: '피츄', tier: 1, cost: 1, type: '전기', hp: 90, maxHp: 90, atk: 30, range: 2, next: '피카츄' },
    '피카츄': { id: 25, name: '피카츄', tier: 2, cost: 3, type: '전기', hp: 220, maxHp: 220, atk: 70, range: 2, next: '라이츄' },
    '라이츄': { id: 26, name: '라이츄', tier: 3, cost: 9, type: '전기', hp: 500, maxHp: 500, atk: 140, range: 3, next: null },

    // 👻 고스트 타입
    '고스통': { id: 92, name: '고스통', tier: 1, cost: 2, type: '고스트', hp: 100, maxHp: 100, atk: 35, range: 2, next: '고우스트' },
    '고우스트': { id: 93, name: '고우스트', tier: 2, cost: 4, type: '고스트', hp: 240, maxHp: 240, atk: 80, range: 2, next: '팬텀' },
    '팬텀': { id: 94, name: '팬텀', tier: 3, cost: 10, type: '고스트', hp: 520, maxHp: 520, atk: 160, range: 3, next: null },

    // 🌊 [추가 예시] 잉어킹 -> 갸라도스 (2단계 진화)
    '잉어킹': { id: 129, name: '잉어킹', tier: 1, cost: 1, type: '물', hp: 70, maxHp: 70, atk: 5, range: 1, next: '갸라도스' },
    '갸라도스': { id: 130, name: '갸라도스', tier: 3, cost: 9, type: '물', hp: 750, maxHp: 750, atk: 130, range: 1, next: null },

    // ⚪ [추가 예시] 푸린 -> 푸크린
    '푸린': { id: 39, name: '푸린', tier: 1, cost: 1, type: '노멀', hp: 180, maxHp: 180, atk: 15, range: 2, next: '푸크린' },
    '푸크린': { id: 40, name: '푸크린', tier: 2, cost: 3, type: '노멀', hp: 400, maxHp: 400, atk: 45, range: 2, next: null }
};

// 2. 상점 무작위 리롤 시 등장하는 기본 1티어 포켓몬 목록 (새로운 포켓몬을 상점에 등장시키려면 추가하세요)
const BASE_POKEMON_POOL = ['파이리', '꼬부기', '이상해씨', '피츄', '고스통', '잉어킹', '푸린'];