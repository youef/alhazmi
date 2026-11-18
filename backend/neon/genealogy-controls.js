export function wireGenealogyEditor() {
  for (const picker of document.querySelectorAll('[data-family-picker]')) {
    const fakhth = picker.querySelector('[data-fakhth]');
    const family = picker.querySelector('[data-family]');
    const label = picker.querySelector('[data-family-label]');
    const tribe = picker.closest('form').querySelector('select[name=tribe_id]');
    const options = [...family.options].map(option => option.cloneNode(true));

    function update() {
      const selected = family.value;
      const selectedOption = options.find(option => option.value === selected);
      for (const option of fakhth.options) {
        option.hidden = Boolean(option.value && tribe && option.dataset.tribe !== tribe.value);
        option.disabled = option.hidden;
      }
      if (fakhth.selectedOptions[0]?.disabled) fakhth.value = '';
      const showLegacy = !fakhth.value && Boolean(selectedOption?.value && !selectedOption.dataset.fakhth);
      const available = options.filter(option =>
        !option.value || (fakhth.value && option.dataset.fakhth === fakhth.value) ||
        (showLegacy && option.value === selected)
      );
      family.replaceChildren(...available.map(option => option.cloneNode(true)));
      family.value = [...family.options].some(option => option.value === selected) ? selected : '';
      label.hidden = !fakhth.value && !showLegacy;
    }
    fakhth.addEventListener('change', update);
    tribe?.addEventListener('change', update);
    update();
  }

  for (const widget of document.querySelectorAll('[data-relative-lookup]')) {
    const form = widget.closest('form');
    const selected = widget.querySelector('input[type=hidden]');
    const input = widget.querySelector('input[type=password]');
    const type = widget.querySelector('select');
    const trigger = widget.querySelector('button');
    const result = widget.querySelector('[data-lookup-result]');
    const idName = selected.name.replace(/_id$/,'');
    const manualName = form.elements[idName + '_name'];
    let version = 0;

    function setMatched(matched) {
      if (!manualName) return;
      manualName.disabled = matched;
      manualName.closest('label').hidden = matched;
    }

    function clear() {
      version++;
      selected.value = input.value.trim() ? '' : widget.dataset.initialId;
      setMatched(Boolean(selected.value));
      result.textContent = input.value.trim() ? 'اضغط بحث لمطابقة الرقم.' : '';
      trigger.disabled = false;
    }

    if (idName === 'co_parent') {
      for (const button of widget.parentElement.querySelectorAll('[data-co-parent-known]')) {
        button.addEventListener('click', () => {
          input.value = '';
          clear();
          selected.value = button.dataset.coParentKnown;
          result.textContent = 'تم اختيار: ' + button.textContent;
        });
      }
    }

    input.addEventListener('input', clear);
    type.addEventListener('change', clear);
    input.addEventListener('keydown', event => {
      if (event.key !== 'Enter') return;
      event.preventDefault();
      trigger.click();
    });
    trigger.addEventListener('click', async () => {
      if (!input.value.trim()) {
        result.textContent = 'أدخل رقم الهوية أو الوثيقة.';
        input.focus();
        return;
      }
      const requestVersion = ++version;
      trigger.disabled = true;
      selected.value = '';
      result.textContent = 'جارٍ البحث…';
      const body = new URLSearchParams({
        csrf: form.elements.csrf.value, operation: 'lookup_relative_identity',
        identity: input.value.trim(), identifier_type: type.value,
        person_id: form.elements.person_id?.value || '',
      });
      try {
        const response = await fetch('/admin/genealogy', { method: 'POST', body });
        const payload = await response.json();
        if (requestVersion !== version) return;
        if (!response.ok) {
          result.textContent = payload.error || 'تعذّرت مطابقة الهوية.';
          return;
        }
        if (!payload.matched) {
          result.textContent = 'لا يوجد سجل مطابق. يمكنك إدخال بيانات قريب جديد.';
          return;
        }
        selected.value = payload.record.id;
        setMatched(true);
        result.textContent = ['تم اختيار: ' + payload.record.full_name_ar, payload.record.masked_value,
          payload.record.fakhth_name, payload.record.family_name].filter(Boolean).join(' · ');
      } catch {
        if (requestVersion === version) result.textContent = 'تعذّر البحث. أعد المحاولة.';
      } finally {
        if (requestVersion === version) trigger.disabled = false;
      }
    });
  }

  for (const role of document.querySelectorAll('select[name=relation_role]')) {
    const form = role.closest('form');
    const coParent = form.querySelector('[data-coparent]');
    const marriage = form.querySelector('[data-marriage-date]');
    const update = () => {
      coParent.hidden = role.value !== 'child';
      for (const control of coParent.querySelectorAll('input,select,button')) control.disabled = coParent.hidden;
      marriage.hidden = role.value !== 'spouse';
    };
    role.addEventListener('change', update);
    update();
  }
  const relations = document.getElementById('gen-family-relations');
  if (relations) {
    const open = () => { relations.open = true; };
    for (const link of document.querySelectorAll('[data-open-relations]')) link.addEventListener('click', open);
    if (location.hash === '#gen-family-relations') open();
  }
}

