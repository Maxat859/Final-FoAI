# QAMAL: PRISON BREAK — ветка `sdda`

Это **распакованная и запускаемая часть участника №2** проекта QAMAL: CSP/Backtracking, учебные вопросы по Python и Go, генератор 1000 вымышленных досье, Decision Tree и метрики.

Ранее файлы лежали в GitHub только внутри `QAMAL_participant_2_code.zip`. Теперь исходники находятся в обычных папках `src/`, `data/`, `tests/`, `docs/` и `scripts/`; ZIP сохранён для архива.

## Проверка через Node.js

```bash
npm test
npm run demo:p2
```

## Интерактивная демонстрация в браузере

```bash
python3 -m http.server 3000
```

Открой `http://localhost:3000/participant2-demo.html` (в Codespaces — порт 3000 и путь `/participant2-demo.html`). Там доступны CSP-замок, задания Python/Go, поиск среди 1000 досье и обучение Decision Tree с реальными рассчитанными метриками.

**Важно:** эта ветка содержит только **часть №2**, а не всю игру. Общий UI и управление разрабатываются в `feature/pixel-art-ui`, охрана — в `feature/minimax-guards`. Не путайте учебные синтетические метки модели с фактами о реальных людях.

Дополнительные инструкции: [README_PARTICIPANT_2.md](README_PARTICIPANT_2.md), [docs/modules/csp-ml.md](docs/modules/csp-ml.md).
