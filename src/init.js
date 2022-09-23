import * as yup from 'yup';
import onChange from 'on-change';
import { isEmpty } from 'lodash';
import i18next from 'i18next';
import axios from 'axios';

import resources from './locales/index.js';
import parser from './parser.js';

const renderFeeds = (elements, feeds) => {
  const { feedsContainer } = elements;
  console.log('in render feeds');
  console.log(feeds);
  const container = document.createElement('div');
  container.classList.add('card', 'border-0');
  const titleContainer = document.createElement('div');
  titleContainer.classList.add('card-body');
  const h2 = document.createElement('h2');
  h2.classList.add('card-title', 'h4');
  h2.textContent = 'Фиды';
  titleContainer.appendChild(h2);
  container.appendChild(titleContainer);
  const ul = document.createElement('ul');
  ul.classList.add('list-group', 'border-0', 'rounded-0');
  const items = feeds.map(({ title, description }) => {
    console.log('in map');
    console.log(title);
    console.log(description);
    const li = document.createElement('li');
    li.classList.add('list-group-item', 'border-0', 'border-end-0');
    const h3 = document.createElement('h3');
    h3.classList.add('h6', 'm-0');
    h3.textContent = title;
    li.appendChild(h3);
    const p = document.createElement('p');
    p.classList.add('m-0', 'small', 'text-black-50');
    p.textContent = description;
    li.appendChild(p);
    return li;
  });
  console.log(feedsContainer);
  // ul.appendChild(...items);
  // container.appendChild(ul);
  // feedsContainer.appendChild(container);
  

};

const rendeError = (elements, error, prevError) => {
  const formHadError = !isEmpty(prevError);
  const formHasError = !isEmpty(error);

  const formContainer = elements.feedForm.form.parentNode;
  const inputFormElement = elements.feedForm.urlInput;
  const { form } = elements.feedForm;
  if (!formHadError && !formHasError) {
    inputFormElement.focus();
    form.reset();
    return;
  }
  if (!formHasError) {
    inputFormElement.classList.remove('is-invalid');
    formContainer.lastChild.remove();
    inputFormElement.focus();
    form.reset();
    return;
  }

  if (formHadError) {
    inputFormElement.classList.remove('is-invalid');
    formContainer.lastChild.remove();
  }
  inputFormElement.classList.add('is-invalid');
  const errorElement = document.createElement('p');
  errorElement.classList.add('feedback', 'm-0', 'position-absolute', 'small', 'text-danger');
  errorElement.textContent = error.message;
  formContainer.appendChild(errorElement);
  inputFormElement.focus();
};

const getPorxyUrl = (url) => {
  const proxyUrl = new URL('/get', 'https://allorigins.hexlet.app');
  proxyUrl.searchParams.set('url', url);
  proxyUrl.searchParams.set('disableCache', 'true');
  return proxyUrl.toString();
};

const render = (elements) => (path, value, prevValue) => {
  switch (path) {
    // case 'form.valid':
    //   elements.feedForm.submitButton.disabled = !value;
    //   break;
    case 'errors':
      rendeError(elements, value, prevValue);
      break;
    case 'uiState.feeds':
      renderFeeds(elements, value);
      break;
    default:
      break;
  }
};

const validateUrl = (url, urls, i18nextInstance) => {
  const shema = yup.string().trim()
    .required(i18nextInstance.t('form.empty'))
    .url(i18nextInstance.t('form.invalid'))
    .notOneOf(urls, i18nextInstance.t('form.exist'));
  return shema.validate(url);
};

export default () => {
  const elements = {
    postsContainer: document.querySelector('.posts'),
    feedsContainer: document.querySelector('.feeds'),
    feedForm: {
      form: document.querySelector('.rss-form'),
      urlInput: document.getElementById('url-input'),
      submitButton: document.querySelector('button[type="submit"]'),
    },
  };
  const defaultLanguage = 'ru';
  const i18n = i18next.createInstance();
  i18n.init({
    lng: defaultLanguage,
    debug: false,
    resources,
  });

  const state = {
    lng: defaultLanguage,
    urls: [],
    feeds: [],
    errors: {},
    processState: '',
    form: {
      valid: true,
      processState: 'filling',
      processError: null,
    },
    uiState: {
      feeds: [],
      posts: [],
      selectedPostId: null,
    },
  };
  const initRender = render(elements, state);
  const watchedState = onChange(state, (path, value, prevValue) => {
    console.log(path);
    // console.log(value);
    // render(elements)(path, value, prevValue);
    initRender(path, value, prevValue);
  });
  elements.feedForm.form.addEventListener('submit', (evt) => {
    evt.preventDefault();
    const formData = new FormData(evt.target);
    const url = formData.get('url').trim();
    validateUrl(url, watchedState.feeds, i18n)
      .then(() => {
        watchedState.errors = {};
        watchedState.urls.push(url);
        watchedState.form.valid = true;
        return axios.get(getPorxyUrl(url));
      })
      .then((response) => {
        watchedState.processState = 'loaded';
        const xml = response.data.contents;
        const obj = parser(xml);
        console.log(obj);
        const { feeds, posts } = obj;
        console.log(feeds);
        watchedState.uiState.feeds.push(...feeds);
        console.log(state.feeds);
        watchedState.uiState.posts.push(...posts);
        watchedState.errors = {};
        watchedState.feeds.push(url);
      })
      .catch((e) => {
        // console.log(e.name);
        switch (e.name) {
          case 'ValidationError':
            watchedState.errors = e;
            watchedState.form.valid = false;
            break;
          case 'AxiosError':
            watchedState.errors = { message: i18n.t('networkError') };
            break;
          case 'ParserError':
            watchedState.errors = { message: 'RSS error' };
            break;
          default:
            throw new Error(`Unexpected error ${e.name}`);
        }
      });
  });
};
