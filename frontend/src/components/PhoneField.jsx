import React from 'react';
import { COUNTRY_PHONE_CODES, sanitizePhoneNumber } from '../lib/phone';

const PhoneField = ({
    countryCode,
    phoneNumber,
    onCountryCodeChange,
    onPhoneNumberChange,
    placeholder,
    required = false,
    wrapperClassName = 'grid gap-3 sm:grid-cols-[126px_minmax(0,1fr)]',
    selectClassName = '',
    inputClassName = '',
}) => (
    <div className={wrapperClassName}>
        <select
            value={countryCode}
            onChange={(event) => onCountryCodeChange(event.target.value)}
            className={selectClassName}
            aria-label="Country code"
        >
            {COUNTRY_PHONE_CODES.map((option) => (
                <option key={`${option.label}-${option.code}`} value={option.code}>
                    {`${option.label} (${option.code})`}
                </option>
            ))}
        </select>
        <input
            value={phoneNumber}
            onChange={(event) => onPhoneNumberChange(sanitizePhoneNumber(event.target.value))}
            className={inputClassName}
            type="tel"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={15}
            autoComplete="tel-national"
            placeholder={placeholder}
            required={required}
        />
    </div>
);

export default PhoneField;
