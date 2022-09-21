import * as yup from 'yup';
import onChange from 'on-change';
import { isEmpty } from 'lodash';
import i18next from 'i18next';
import axios from 'axios';

import resources from './locales/index.js';
import parser from './parser.js';

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
    form: {
      valid: true,
      processState: 'filling',
      processError: null,
    },
  };
  const initRender = render(elements);
  const watchedState = onChange(state, (path, value, prevValue) => {
    // console.log(state.form.errors.type);
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
        const xml = response.data.contents;
        const obj = parser(xml);
        console.log(obj);
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
          default:
            throw new Error(`Unexpected error ${e.name}`);
        }
      });
  });
};
