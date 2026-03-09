import React from 'react';

const StoryText: React.FC = () => {
  return (
    <div className="story-text">
      <h2>Understanding Spring Break Affordability in New Jersey</h2>
      <p>
        Spring break sounds fun until the costs pile up. This app helps you test what is actually affordable by
        changing budget, trip length, and how many people share lodging. Start with the destination comparison chart:
        it shows total estimated trip cost for each NJ location under your current settings.
      </p>
      <p>
        The key interaction is the lodging share selector. When you move from 1 person to 4 people splitting a room,
        lodging drops per person and several destinations can flip from over-budget to affordable. Trip length matters
        too: moving from 2 days to 4 days raises food and lodging nights, which can push shore destinations above a
        student budget.
      </p>
      <p>
        Use the cost breakdown view to see where your money goes. In many cases, lodging is the largest part of the
        total, not travel. The distance vs cost plot also shows that closer does not always mean cheaper if lodging is
        expensive.
      </p>
      <p>
        Takeaway: affordable spring break options exist, but they depend on group size and trip length. Sandy Hook and
        other lower-cost choices can stay in budget even when money is tight. Limitation: these are estimated values,
        not live prices, so actual booking costs may be higher or lower.
      </p>
    </div>
  );
};

export default StoryText;