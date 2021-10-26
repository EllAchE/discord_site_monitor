import { cleanNumberString, extractArgumentsFromString, shouldIgnoreChange } from "../utils/utils";
import { getEmptyMockSite } from "./testHelpers";
import { readFileSync } from 'fs-extra';
import { getLastRss, getSubstringPrefixMatch } from "../monitor_methods";


describe('cleanNumberString', () => {
    it('should remove dollar sign and commas', () => {
        const a = cleanNumberString("$35,789,152", false)
        expect(a).toEqual(35789152);
    });

    it('should succeed with nothing to remove', () => {
        const a = cleanNumberString("35789152", false)
        expect(a).toEqual(35789152);
    });

    it('should remove percent sign', () => {
        const a = cleanNumberString("357%89152%", false)
        expect(a).toEqual(35789152);
    })

    it('should return number unchanaged', () => {
        const a = cleanNumberString(35789152, false)
        expect(a).toEqual(35789152);
    })
})

describe('shouldIgnoreSmallChange', () => {
    it('should return true with change', () => {
        expect(shouldIgnoreChange('90', '100', 3)).toBe(false);
    });

    it('should return false with change', () => {
        expect(shouldIgnoreChange('101', '100', 3)).toBe(true);
    });

    it('should return true with change', () => {
        expect(shouldIgnoreChange('100', '90', 3)).toBe(false);
    });

    it('should return false with change', () => {
        expect(shouldIgnoreChange('100', '101', 3)).toBe(true);
    });
})

describe('should extract arguments from string', () => {
    it('should extract arguments from valid string', () => {
        expect(extractArgumentsFromString("alpha beta 523.43 aaa")).toEqual(["alpha", "beta", "523.43", "aaa"])
    })

    it('should extract no arguments from empty string', () => {
        expect(extractArgumentsFromString("          ")).toEqual([]);
    })

    it('should extract arguments from extra space string', () => {
        expect(extractArgumentsFromString("   aaa      bbb ")).toEqual(["aaa", "bbb"]);
    })

    it('should extract arguments from single arg string', () => {
        expect(extractArgumentsFromString("singlearg")).toEqual(["singlearg"]);
    })
})

describe('should get last rss', () => {
    const mockSite = getEmptyMockSite();
    mockSite.contentSelector = "title";

    it('should get last rss', async () => {
        await expect(await getLastRss(mockSite, readFileSync('src/test/resources/test.rss').toString())).toBe("Summary for Tropical Depression Pamela (EP1/EP162021)")
    })

    it('should return NO MATCH FOUND when failing to parse rss', async () => {
        const res = await getLastRss(mockSite, readFileSync('src/test/resources/invalid.rss'));
        expect(res).toBe("NO MATCH FOUND");
    })
})

describe('should get substring prefix match', () => {
    const mockSite = getEmptyMockSite();

    it('should extract value using substring', () => {
        mockSite.substring = "onse "
        expect(getSubstringPrefixMatch(mockSite, "alphabet response string")).toBe("string")
    })


    it('should return NO MATCH FOUND when there is no match', () => {
        mockSite.substring = "one "
        expect(getSubstringPrefixMatch(mockSite, "response string")).toBe("NO MATCH FOUND")
    })

    it('should return first instance when there are multiple instances', () => {
        mockSite.substring = "baa"
        expect(getSubstringPrefixMatch(mockSite, "baaedc baa \n\t baaok")).toBe("edc baa \n\t baaok")
    })
})

// describe('should get css from index', () => {
//     const mockSite = getMockSite()
//     it('should return NO MATCH FOUND when index not specified or negative', () => {
//         expect(getCssFromIndex(mockSite, "abc", -9)).toBe('NO MATCH FOUND')
//     }) // order matters

//     it('should get css from index', () => {

//     })

//     it('should throw error when css not specified', () => {

//     })
// })

