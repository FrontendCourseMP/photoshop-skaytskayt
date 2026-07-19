export interface KernelPreset {
  label: string;
  values: number[];
  divisor: number;
  offset: number;
  /** Брать модуль свёртки (для градиентных операторов) */
  absolute?: boolean;
}

export const KERNEL_PRESETS: KernelPreset[] = [
  {
    label: 'Тождественное отображение',
    values: [0, 0, 0, 0, 1, 0, 0, 0, 0],
    divisor: 1,
    offset: 0,
  },
  {
    label: 'Повышение резкости',
    values: [-1, -1, -1, -1, 9, -1, -1, -1, -1],
    divisor: 1,
    offset: 0,
  },
  {
    label: 'Фильтр Гаусса 3×3',
    values: [1, 2, 1, 2, 4, 2, 1, 2, 1],
    divisor: 16,
    offset: 0,
  },
  {
    label: 'Прямоугольное размытие',
    values: [1, 1, 1, 1, 1, 1, 1, 1, 1],
    divisor: 9,
    offset: 0,
  },
  {
    // Модуль свёртки: границы яркие независимо от знака градиента,
    // однородные области остаются чёрными.
    label: 'Оператор Прюитта (горизонт.)',
    values: [-1, 0, 1, -1, 0, 1, -1, 0, 1],
    divisor: 1,
    offset: 0,
    absolute: true,
  },
  {
    label: 'Оператор Прюитта (вертик.)',
    values: [-1, -1, -1, 0, 0, 0, 1, 1, 1],
    divisor: 1,
    offset: 0,
    absolute: true,
  },
];
