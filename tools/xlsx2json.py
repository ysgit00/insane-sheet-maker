"""인세인 어빌리티 xlsx -> 월드세팅별 JSON + 전체 묶음 (data/ 에 출력)

사용: python3 tools/xlsx2json.py 어빌리티.xlsx [출력폴더=data]
"""
import json, re, sys
from collections import Counter
from pathlib import Path
import openpyxl

SHEET_WORLD = {'이식': '이식'}  # 월드세팅 열이 없는 시트
BASIC = {'1.0': '1권', '2.0': '2권'}  # 월드세팅 '-' 은 출처 열로 구분


def skill(v):
    v = str(v or '없음').strip()
    v = re.sub(r'(\S+) 분야(?:에서|의 특기 중에서) 아무거나', r'\1', v)
    v = re.sub(r'(\S+) 가변', r'\1', v)
    return '임의' if v == '가변' else v


def main(src, out='data'):
    packs, names = {}, Counter()
    for ws in openpyxl.load_workbook(src, read_only=True).worksheets:
        rows = list(ws.iter_rows(values_only=True))
        hi = next(i for i, r in enumerate(rows) if r and '분야' in r)
        col = {str(c).strip(): i for i, c in enumerate(rows[hi]) if c}
        typ = '공격'  # 첫 분야 셀이 비어 있는 경우
        for r in rows[hi + 1:]:
            get = lambda k: r[col[k]] if k in col and col[k] < len(r) else None
            typ = get('분야') or typ  # 병합 셀
            name = get('이름')
            if not name:
                continue
            world = SHEET_WORLD.get(ws.title) or re.sub(r'\s+', ' ', str(get('월드세팅') or '-')).strip()
            if world == '-':
                world = BASIC.get(str(get('')).strip(), '기본')  # 출처 열 (헤더 공백)
            name = str(name).strip()
            names[name] += 1
            packs.setdefault(world, {})[name] = {
                'type': typ, 'skill': skill(get('지정특기')), 'effect': str(get('설명') or '').strip()}
    Path(out).mkdir(exist_ok=True)
    for world, abilities in packs.items():
        f = Path(out) / f'{world}.json'
        f.write_text(json.dumps({'world': world, 'abilities': abilities}, ensure_ascii=False, indent=2))
        print(f'{f}: {len(abilities)}')
    order = sorted(packs, key=lambda w: w not in BASIC.values())  # 1·2권 먼저
    bundle = [{'world': w, 'abilities': packs[w]} for w in order]
    (Path(out) / '_전체.json').write_text(json.dumps(bundle, ensure_ascii=False, indent=2))
    print(f'{out}/_전체.json: 월드세팅 {len(bundle)}개 묶음')
    dup = [n for n, c in names.items() if c > 1]
    if dup:
        print('여러 월드세팅에 같은 이름:', dup)


if __name__ == '__main__':
    main(*sys.argv[1:])
