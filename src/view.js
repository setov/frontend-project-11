import { isEmpty } from 'lodash';

const renderFeeds = (elements, feeds) => {
  const { feedsContainer } = elements;
  feedsContainer.innerHTML = '';
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
  items.map((item) => ul.appendChild(item));
  container.appendChild(ul);
  feedsContainer.appendChild(container);
};

const renderPosts = (elements, posts) => {
  const { postsContainer } = elements;
  postsContainer.innerHTML = '';
  const container = document.createElement('div');
  container.classList.add('card', 'border-0');
  const titleContainer = document.createElement('div');
  titleContainer.classList.add('card-body');
  const h2 = document.createElement('h2');
  h2.classList.add('card-title', 'h4');
  h2.textContent = 'Посты';
  titleContainer.appendChild(h2);
  container.appendChild(titleContainer);
  const ul = document.createElement('ul');
  ul.classList.add('list-group', 'border-0', 'rounded-0');

  const items = posts.map(({
    title, link, id, feedId,
  }) => {
    const li = document.createElement('li');
    li.classList.add(
      'list-group-item',
      'd-flex',
      'justify-content-between',
      'align-items-start',
      'border-0',
      'border-end-0',
    );
    const a = document.createElement('a');
    a.setAttribute('href', link);
    a.classList.add('fw-bold');
    a.dataset.id = id;
    a.dataset.feedId = feedId;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.textContent = title;
    const btn = document.createElement('button');
    btn.classList.add(
      'btn',
      'btn-outline-primary',
      'btn-sm',
    );
    btn.dataset.id = id;
    btn.dataset.bsToggle = 'modal';
    btn.dataset.bsTarget = '#modal';
    btn.textContent = 'Просмотр';

    li.appendChild(a);
    li.appendChild(btn);
    return li;
  });
  items.map((item) => ul.appendChild(item));
  container.appendChild(ul);
  postsContainer.appendChild(container);
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

export default (elements) => (path, value, prevValue) => {
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
    case 'uiState.posts':
      renderPosts(elements, value);
      break;
    default:
      break;
  }
};
