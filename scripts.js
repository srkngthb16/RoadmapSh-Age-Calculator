// scripts.js
(function(){
	// Prefer global luxon if available
	const DateTime = window.luxon ? window.luxon.DateTime : null;

	const birthInput = document.getElementById('birthdate');
	const form = document.getElementById('ageForm');
	const resultEl = document.getElementById('result');
	const errorEl = document.getElementById('error');

	// Initialize Flatpickr
	if (window.flatpickr) {
		flatpickr(birthInput, {
			altInput: true,
			altFormat: "d/m/Y",
			dateFormat: "Y-m-d",
			maxDate: "today",
			allowInput: false
		});
	} else {
		birthInput.type = 'date'; // fallback
	}

	function clearMessages(){
		errorEl.textContent = '';
		resultEl.textContent = '';
	}

	function validateBirthDate(value){
		if(!value) return 'Please select a birth date.';
		// try parsing with Luxon if present
		if(!DateTime){
			// basic fallback parse YYYY-MM-DD
			const m = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
			if(!m) return 'Invalid date format.';
			const y = Number(m[1]), mo = Number(m[2]) - 1, d = Number(m[3]);
			const dt = new Date(y, mo, d);
			if(isNaN(dt)) return 'Invalid date.';
			if(dt > new Date()) return 'Birth date cannot be in the future.';
			return null;
		}

		const dt = DateTime.fromISO(value);
		if(!dt.isValid) return 'Invalid date.';
		if(dt > DateTime.now()) return 'Birth date cannot be in the future.';
		return null;
	}

	function calculateAgeISO(iso){
		if(!DateTime) {
			// no luxon — simple fallback: compute years and months approximately
			const now = new Date();
			const then = new Date(iso);
			let years = now.getFullYear() - then.getFullYear();
			let months = now.getMonth() - then.getMonth();
			let days = now.getDate() - then.getDate();
			if(days < 0){
				months -= 1;
				// approximate days in previous month
				days += 30;
			}
			if(months < 0){
				years -= 1; months += 12;
			}
			return {years, months, days};
		}

		const now = DateTime.now().startOf('day');
		const dob = DateTime.fromISO(iso).startOf('day');
		// Use Luxon's diff with largestUnit to get years, months, days
		let diff = now.diff(dob, ['years','months','days']).toObject();

		// diff may return fractional months/days; use DateTime.plus to compute whole units
		const years = Math.floor(diff.years || 0);
		const afterYears = dob.plus({years});
		const months = Math.floor(now.diff(afterYears, 'months').months);
		const afterMonths = afterYears.plus({months});
		const days = Math.floor(now.diff(afterMonths, 'days').days);

		return {years, months, days};
	}

	form.addEventListener('submit', function(e){
		e.preventDefault();
		clearMessages();
		const val = birthInput.value;
		const err = validateBirthDate(val);
		if(err){ errorEl.textContent = err; return; }

		const age = calculateAgeISO(val);
		// build readable string
		const parts = [];
		if (typeof age.years === 'number') parts.push(`${age.years} ${age.years === 1 ? 'year' : 'years'}`);
		if (typeof age.months === 'number') parts.push(`${age.months} ${age.months === 1 ? 'month' : 'months'}`);
		if (typeof age.days === 'number') parts.push(`${age.days} ${age.days === 1 ? 'day' : 'days'}`);

		resultEl.innerHTML = `You are <strong>${parts.join(' ')}</strong> old`;
	});

})();

