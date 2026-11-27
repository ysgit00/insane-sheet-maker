# insane-sheet-maker

인세인 캐릭터 시트 작성 툴. `index.html` 을 브라우저로 열어 사용합니다.

## 어빌리티 데이터

레포에는 어빌리티 데이터가 포함되어 있지 않습니다. 월드세팅별 JSON 파일로 만들어
화면의 **데이터 불러오기** 로 업로드하세요 (여러 파일 동시 선택 가능, 브라우저에 저장됨).

```json
{
  "world": "데드루프",
  "abilities": {
    "어빌리티 이름": { "type": "공격", "skill": "임의", "effect": "효과 텍스트" }
  }
}
```

- `type`: 공격 / 서포트 / 장비
- `skill`: 특기명 / 분야명(그 분야에서 아무거나) / `임의`(전체) / `없음`, 쉼표로 여러 개 (`폭력, 의학`). 후보가 둘 이상이면 사용자가 선택
- 로컬 보관용 `data/` 폴더는 `.gitignore` 처리되어 있습니다.

### 엑셀에서 변환

```sh
pip install openpyxl
python3 tools/xlsx2json.py 어빌리티.xlsx   # data/ 에 월드세팅별 JSON + _전체.json 생성
```
