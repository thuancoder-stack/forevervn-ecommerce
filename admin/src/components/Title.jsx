const Title = ({ text1, text2 }) => {
  return (
    <div className="inline-flex flex-wrap items-center gap-3">
      <p className="display-font text-2xl font-semibold tracking-[-0.04em] text-slate-400 sm:text-3xl">
        {text1} <span className="text-slate-900">{text2}</span>
      </p>
      <span className="h-px w-10 rounded-full bg-slate-300 sm:w-14" />
    </div>
  );
};

export default Title;
