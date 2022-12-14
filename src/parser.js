import { uniqueId } from 'lodash';

export default (xmlString) => {
  const parser = new DOMParser();
  const dom = parser.parseFromString(xmlString, 'application/xml');
  const isParserError = dom.querySelector('parsererror');
  if (isParserError) {
    const error = new Error(`parserError: ${isParserError.textContent}`);
    error.name = 'ParserError';
    throw error;
  }
  const feedId = uniqueId();
  const feed = {
    id: feedId,
    title: dom.querySelector('title').textContent,
    link: dom.querySelector('link').textContent,
    description: dom.querySelector('description').textContent,
  };
  const feeds = [];
  feeds.push(feed);
  const posts = [];
  const nodeListItems = dom.querySelectorAll('item');
  nodeListItems.forEach((item) => {
    const post = {
      id: uniqueId(),
      title: item.querySelector('title').textContent,
      link: item.querySelector('link').textContent,
      description: item.querySelector('description').textContent,
      feedId,
    };
    posts.push(post);
  });
  return { feeds, posts };
};
