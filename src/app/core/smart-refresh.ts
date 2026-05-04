import { fromEvent, merge, timer, Observable } from 'rxjs';
import { filter, startWith } from 'rxjs/operators';

/**
 * Emite imediatamente e toda vez que:
 *  1. A página volta a ficar visível (visibilitychange)
 *  2. A janela recupera o foco (focus)
 *  3. O intervalo `intervalMs` passa enquanto a página é visível
 *
 * Substitui o `interval(10000)` puro, que drena bateria e dados móveis.
 */
export function createSmartRefresh$(intervalMs = 60_000): Observable<unknown> {
  const visible$ = fromEvent(document, 'visibilitychange').pipe(
    filter(() => !document.hidden)
  );
  const focus$ = fromEvent(window, 'focus');
  const tick$ = timer(0, intervalMs).pipe(
    filter(() => !document.hidden)
  );

  return merge(tick$, visible$, focus$).pipe(startWith(0));
}
