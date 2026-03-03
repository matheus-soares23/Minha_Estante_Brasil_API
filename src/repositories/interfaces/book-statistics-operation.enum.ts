export enum BookStatisticsOperation {
  /**
   * - Review: adiciona rating às estatísticas
   * - UserBookList: incrementa popularidade
   */
  ADD = 'add',

  /**
   * - Review: remove rating das estatísticas
   * - UserBookList: decrementa popularidade
   */
  REMOVE = 'remove',

  /**
   * - Review: atualiza rating de forma incremental
   * - UserBookList: geralmente não afeta estatísticas
   */
  UPDATE = 'update',
}
