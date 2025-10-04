// src/components/KeyboardLock.tsx
import { useEffect } from 'react';

export default function KeyboardLock(): JSX.Element | null {
  useEffect(() => {
    const vv = (window as any).visualViewport;
    let baseHeight = vv?.height ?? window.innerHeight;
    let keyboardOpen = false;
    let lockedScrollY = 0;
    const threshold = 80; // порог в px для детекции клавиатуры

    const setVh = (h: number) => {
      document.documentElement.style.setProperty('--vh', `${h * 0.01}px`);
    };
    setVh(baseHeight);

    const enableGlobalTouchBlock = () => {
      // CSS fallback: блокируем жесты на уровне html
      document.documentElement.style.touchAction = 'none';
      // предотвращаем overscroll/накатывание
      document.documentElement.style.overscrollBehavior = 'none';
      document.body.style.overscrollBehavior = 'none';
    };
    const disableGlobalTouchBlock = () => {
      document.documentElement.style.touchAction = '';
      document.documentElement.style.overscrollBehavior = '';
      document.body.style.overscrollBehavior = '';
    };

    const onViewportChange = () => {
      const vvLocal = (window as any).visualViewport;
      const height = vvLocal?.height ?? window.innerHeight;

      setVh(height);

      if (!keyboardOpen && height < baseHeight - threshold) {
        keyboardOpen = true;
        lockedScrollY = window.scrollY || window.pageYOffset || 0;

        // lock page with fixed body (prevents browser "поднимать" контент)
        document.body.style.position = 'fixed';
        document.body.style.top = `-${lockedScrollY}px`;
        document.body.style.left = '0';
        document.body.style.right = '0';
        document.body.style.width = '100%';
        document.body.classList.add('keyboard-open');

        // блокируем глобальные жесты прокрутки
        enableGlobalTouchBlock();
      } else if (keyboardOpen && height >= baseHeight - threshold) {
        keyboardOpen = false;

        document.body.classList.remove('keyboard-open');
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.left = '';
        document.body.style.right = '';
        document.body.style.width = '';

        // восстановим скролл на прежнюю позицию
        window.scrollTo(0, lockedScrollY);

        // снимаем блок
        disableGlobalTouchBlock();

        // обновляем базовую высоту
        baseHeight = height;
      } else if (!keyboardOpen) {
        // обновляем базовую высоту при ориентации и т.п.
        baseHeight = height;
      }
    };

    // слушатели viewport / resize
    if ((window as any).visualViewport) {
      (window as any).visualViewport.addEventListener('resize', onViewportChange);
      (window as any).visualViewport.addEventListener('scroll', onViewportChange);
    }
    window.addEventListener('resize', onViewportChange);

    // агрессивная блокировка жестов: touchmove + pointermove
    const onTouchMove = (e: TouchEvent) => {
      if (keyboardOpen) {
        // если нужно разрешить скролл внутри textarea или в специально помеченном элементе,
        // можно проверять e.target.closest('[data-allow-keyboard-scroll]') и в этом случае возвращать.
        e.preventDefault();
      }
    };
    const onPointerMove = (e: PointerEvent) => {
      if (keyboardOpen) {
        e.preventDefault();
      }
    };

    // Ставим passive: false для touchmove, чтобы иметь возможность preventDefault()
    document.addEventListener('touchmove', onTouchMove, { passive: false });
    document.addEventListener('pointermove', onPointerMove, { passive: false });

    // touchstart/pointerdown можем использовать для логирования/диагностики
    const onPointerDown = () => { /* noop - оставил для возможной логики */ };
    document.addEventListener('pointerdown', onPointerDown);

    return () => {
      if ((window as any).visualViewport) {
        (window as any).visualViewport.removeEventListener('resize', onViewportChange);
        (window as any).visualViewport.removeEventListener('scroll', onViewportChange);
      }
      window.removeEventListener('resize', onViewportChange);
      document.removeEventListener('touchmove', onTouchMove);
      document.removeEventListener('pointermove', onPointerMove);
      document.removeEventListener('pointerdown', onPointerDown);

      // очистка стилей на случай, если компонент размонтируется в заблокированном состоянии
      disableGlobalTouchBlock();
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.right = '';
      document.body.style.width = '';
      document.body.classList.remove('keyboard-open');
    };
  }, []);

  return null;
}
