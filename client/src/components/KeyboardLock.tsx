import { useEffect } from 'react';

export default function KeyboardLock(): JSX.Element | null {
  useEffect(() => {
    const vv = (window as any).visualViewport;
    let baseHeight = vv?.height ?? window.innerHeight;
    let keyboardOpen = false;
    let lockedScrollY = 0;

    const setVh = (h: number) => {
      document.documentElement.style.setProperty('--vh', `${h * 0.01}px`);
    };
    setVh(baseHeight);

    const threshold = 80; // px — при необходимости увеличь/уменьши

    const onViewportChange = () => {
      const vvLocal = (window as any).visualViewport;
      const height = vvLocal?.height ?? window.innerHeight;

      // обновляем CSS-переменную vh
      setVh(height);

      // детект открытия клавиатуры
      if (!keyboardOpen && height < baseHeight - threshold) {
        keyboardOpen = true;
        lockedScrollY = window.scrollY || window.pageYOffset || 0;

        // lock page: фиксируем тело, чтобы браузер не «поднимал» контент
        document.body.style.position = 'fixed';
        document.body.style.top = `-${lockedScrollY}px`;
        document.body.style.left = '0';
        document.body.style.right = '0';
        document.body.style.width = '100%';
        document.body.classList.add('keyboard-open');
      } else if (keyboardOpen && height >= baseHeight - threshold) {
        // клавиатура закрылась — восстановление
        keyboardOpen = false;

        document.body.classList.remove('keyboard-open');
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.left = '';
        document.body.style.right = '';
        document.body.style.width = '';

        // восстановим позицию скролла
        window.scrollTo(0, lockedScrollY);

        // обновим базовую высоту (на случай поворота экрана и т.п.)
        baseHeight = height;
      } else if (!keyboardOpen) {
        // нет клавиатуры — сохраняем актуальную базовую высоту (например, при повороте)
        baseHeight = height;
      }
    };

    // слушаем visualViewport если есть (точнее для клавиатуры), и fallback на window.resize
    if ((window as any).visualViewport) {
      (window as any).visualViewport.addEventListener('resize', onViewportChange);
      (window as any).visualViewport.addEventListener('scroll', onViewportChange);
    }
    window.addEventListener('resize', onViewportChange);

    // предотвращаем нежелательный touch-scrolling пока клавиатура открыта (опционально)
    const onTouchMove = (e: TouchEvent) => {
      if (keyboardOpen) {
        const tgt = e.target as HTMLElement | null;
        if (tgt && !['INPUT', 'TEXTAREA', 'SELECT'].includes(tgt.tagName)) {
          e.preventDefault(); // блокируем скролл страницы
        }
      }
    };
    document.addEventListener('touchmove', onTouchMove, { passive: false });

    return () => {
      if ((window as any).visualViewport) {
        (window as any).visualViewport.removeEventListener('resize', onViewportChange);
        (window as any).visualViewport.removeEventListener('scroll', onViewportChange);
      }
      window.removeEventListener('resize', onViewportChange);
      document.removeEventListener('touchmove', onTouchMove);
      // очистка на случай, если компонент размонтируется в состоянии блокировки
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
